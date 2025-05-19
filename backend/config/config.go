package config

import (
	"github.com/spf13/viper"
)

// Config stores all configuration of the application.
// The values are read by viper from a config file or environment variable.
type Config struct {
	DBSource      string `mapstructure:"DB_SOURCE"`
	RedisAddress  string `mapstructure:"REDIS_ADDRESS"`
	RedisPassword string `mapstructure:"REDIS_PASSWORD"`
	RedisDB       int    `mapstructure:"REDIS_DB"`
	ServerAddress string `mapstructure:"SERVER_ADDRESS"`
	StripeAPIKey  string `mapstructure:"STRIPE_API_KEY"`
}

// LoadConfig reads configuration from file or environment variables.
func LoadConfig(path string) (config Config, err error) {
	viper.AddConfigPath(path)
	viper.SetConfigName("app") // Name of config file (without extension)
	viper.SetConfigType("env") // Can be json, yaml, env, etc.

	viper.AutomaticEnv() // Read in environment variables that match

	err = viper.ReadInConfig()
	if err != nil {
		// If config file not found, try to use environment variables only
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return
		}
	}

	err = viper.Unmarshal(&config)
	return
}
