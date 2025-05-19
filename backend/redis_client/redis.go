package redis_client

import (
	"context"
	"fmt"
	"log"

	"github.com/redis/go-redis/v9"
)

var Rdb *redis.Client
var Ctx = context.Background()

// InitRedis initializes the Redis client.
func InitRedis(address string, password string, db int) {
	Rdb = redis.NewClient(&redis.Options{
		Addr:     address,
		Password: password, // no password set
		DB:       db,       // use default DB
	})

	// Ping the Redis server to check the connection.
	_, err := Rdb.Ping(Ctx).Result()
	if err != nil {
		log.Fatalf("Could not connect to Redis: %v", err)
	}

	fmt.Println("Successfully connected to Redis!")
}

// CloseRedis closes the Redis client connection.
// It's good practice to close the client when the application shuts down.
func CloseRedis() {
	if Rdb != nil {
		err := Rdb.Close()
		if err != nil {
			log.Printf("Error closing Redis connection: %v", err)
		} else {
			fmt.Println("Redis connection closed.")
		}
	}
}
