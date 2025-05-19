package models

import (
	"time"
)

// User represents the structure of our user table
type User struct {
	ID            int        `json:"id"`
	Username      string     `json:"username" binding:"required"`
	PasswordHash  string     `json:"-"` // Password hash should not be exposed in JSON responses
	Email         string     `json:"email" binding:"required,email"`
	FullName      string     `json:"full_name"`
	Phone         string     `json:"phone"`
	Address       string     `json:"address"`
	City          string     `json:"city"`
	StateProvince string     `json:"state_province"`
	ZipPostalCode string     `json:"zip_postal_code"`
	Role          string     `json:"role"` // 'user', 'admin', etc.
	LastLogin     *time.Time `json:"last_login"`
	AccountStatus string     `json:"account_status"` // 'active', 'inactive', 'suspended'
	RefreshToken  string     `json:"-"` // Not exposed in JSON responses
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// UserRegister represents the data needed for user registration
type UserRegister struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6,max=50"`
	Email    string `json:"email" binding:"required,email"`
}

// UserLogin represents the data needed for user login
type UserLogin struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// UserResponse represents the user data sent back in responses
type UserResponse struct {
	ID            int        `json:"id"`
	Username      string     `json:"username"`
	Email         string     `json:"email"`
	FullName      string     `json:"full_name,omitempty"`
	Phone         string     `json:"phone,omitempty"`
	Address       string     `json:"address,omitempty"`
	City          string     `json:"city,omitempty"`
	StateProvince string     `json:"state_province,omitempty"`
	ZipPostalCode string     `json:"zip_postal_code,omitempty"`
	Role          string     `json:"role"`
	LastLogin     *time.Time `json:"last_login,omitempty"`
	AccountStatus string     `json:"account_status"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// TokenResponse represents the token data sent back after login or refresh
type TokenResponse struct {
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	ExpiresIn    int         `json:"expires_in"` // Seconds until access token expires
}

