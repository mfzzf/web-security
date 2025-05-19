package utils

import (
	"context"
	"fmt"
	"strconv"
	"time"
	"web-security/backend/redis_client"
)

const (
	// Redis中存储令牌的前缀
	accessTokenPrefix  = "access_token:"
	refreshTokenPrefix = "refresh_token:"
	// 令牌黑名单前缀
	tokenBlacklistPrefix = "blacklist:"
)

// StoreAccessToken 将访问令牌存储到Redis中
func StoreAccessToken(userID int, token string) error {
	// 以"access_token:用户ID"为键存储访问令牌
	key := accessTokenPrefix + strconv.Itoa(userID)
	// 设置令牌过期时间略长于令牌本身的过期时间，以便有时间进行清理
	expiry := AccessTokenExpiry + 5*time.Minute

	_, err := redis_client.Rdb.Set(context.Background(), key, token, expiry).Result()
	return err
}

// StoreRefreshToken 将刷新令牌存储到Redis中
func StoreRefreshToken(userID int, token string) error {
	// 以"refresh_token:用户ID"为键存储刷新令牌
	key := refreshTokenPrefix + strconv.Itoa(userID)
	// 设置令牌过期时间略长于令牌本身的过期时间
	expiry := RefreshTokenExpiry + 1*time.Hour

	_, err := redis_client.Rdb.Set(context.Background(), key, token, expiry).Result()
	return err
}

// ValidateTokenInRedis 验证令牌是否存在于Redis中并且是最新的
func ValidateTokenInRedis(userID int, token string, isAccessToken bool) (bool, error) {
	prefix := refreshTokenPrefix
	if isAccessToken {
		prefix = accessTokenPrefix
	}
	key := prefix + strconv.Itoa(userID)

	// 从Redis获取当前存储的令牌
	storedToken, err := redis_client.Rdb.Get(context.Background(), key).Result()
	if err != nil {
		// 如果键不存在，令牌无效
		return false, fmt.Errorf("令牌不存在于Redis中: %w", err)
	}

	// 检查提供的令牌是否与存储的令牌匹配
	return token == storedToken, nil
}

// IsTokenBlacklisted 检查令牌是否在黑名单中
func IsTokenBlacklisted(token string) (bool, error) {
	key := tokenBlacklistPrefix + token
	exists, err := redis_client.Rdb.Exists(context.Background(), key).Result()
	if err != nil {
		return false, err
	}
	return exists > 0, nil
}

// BlacklistToken 将令牌加入黑名单
func BlacklistToken(token string, expiry time.Duration) error {
	key := tokenBlacklistPrefix + token
	_, err := redis_client.Rdb.Set(context.Background(), key, "blacklisted", expiry).Result()
	return err
}

// InvalidateUserTokens 使指定用户的所有令牌失效（例如在密码更改或注销所有设备时）
func InvalidateUserTokens(userID int) error {
	accessKey := accessTokenPrefix + strconv.Itoa(userID)
	refreshKey := refreshTokenPrefix + strconv.Itoa(userID)

	// 获取当前令牌，以便将它们加入黑名单
	accessToken, err := redis_client.Rdb.Get(context.Background(), accessKey).Result()
	if err == nil {
		// 如果令牌存在，将其加入黑名单
		if err := BlacklistToken(accessToken, AccessTokenExpiry); err != nil {
			return err
		}
	}

	refreshToken, err := redis_client.Rdb.Get(context.Background(), refreshKey).Result()
	if err == nil {
		// 如果令牌存在，将其加入黑名单
		if err := BlacklistToken(refreshToken, RefreshTokenExpiry); err != nil {
			return err
		}
	}

	// 从Redis中删除令牌
	pipe := redis_client.Rdb.Pipeline()
	pipe.Del(context.Background(), accessKey)
	pipe.Del(context.Background(), refreshKey)
	_, err = pipe.Exec(context.Background())
	return err
}
