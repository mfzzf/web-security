package utils

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// JWT相关的配置常量
const (
	// JWTSecret 签名密钥，在实际生产环境中应该从环境变量或配置文件中读取
	// 这个密钥只是示例，不要在生产环境使用
	jwtSecret = "XvhM9%tH#qsP8^5!ZkL2@3aW7*dG6fYbE"
)

// 时间常量
var (
	// AccessTokenExpiry Access token的有效期为15分钟
	AccessTokenExpiry = 15 * time.Minute
	// RefreshTokenExpiry Refresh token的有效期为7天
	RefreshTokenExpiry = 7 * 24 * time.Hour
)

// Claims是我们JWT中的自定义声明
type Claims struct {
	UserID   int    `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	TokenType string `json:"token_type"` // "access" or "refresh"
	jwt.RegisteredClaims
}

// GenerateJWTPair 生成一对JWT令牌（access token和refresh token）
func GenerateJWTPair(userID int, username, role string) (string, string, error) {
	// 生成Access Token
	accessToken, err := generateToken(userID, username, role, "access", AccessTokenExpiry)
	if err != nil {
		return "", "", fmt.Errorf("生成访问令牌失败: %w", err)
	}

	// 生成Refresh Token
	refreshToken, err := generateToken(userID, username, role, "refresh", RefreshTokenExpiry)
	if err != nil {
		return "", "", fmt.Errorf("生成刷新令牌失败: %w", err)
	}

	return accessToken, refreshToken, nil
}

// generateToken 是一个辅助函数，用于生成特定类型的JWT令牌
func generateToken(userID int, username, role, tokenType string, expiry time.Duration) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID:   userID,
		Username: username,
		Role:     role,
		TokenType: tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    "web-security-app",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ParseToken 解析并验证JWT令牌，返回Claims
func ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(
		tokenString,
		&Claims{},
		func(token *jwt.Token) (interface{}, error) {
			// 验证签名方法
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("意外的签名方法: %v", token.Header["alg"])
			}
			return []byte(jwtSecret), nil
		},
	)

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("无效的令牌")
	}

	return claims, nil
}

// ValidateAccessToken 验证访问令牌是否有效
func ValidateAccessToken(tokenString string) (*Claims, error) {
	claims, err := ParseToken(tokenString)
	if err != nil {
		return nil, err
	}
	
	if claims.TokenType != "access" {
		return nil, errors.New("无效的访问令牌类型")
	}

	return claims, nil
}

// ValidateRefreshToken 验证刷新令牌是否有效
func ValidateRefreshToken(tokenString string) (*Claims, error) {
	claims, err := ParseToken(tokenString)
	if err != nil {
		return nil, err
	}
	
	if claims.TokenType != "refresh" {
		return nil, errors.New("无效的刷新令牌类型")
	}

	return claims, nil
}
