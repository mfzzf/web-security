package db

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/go-sql-driver/mysql" // MySQL driver
)

var DB *sql.DB

// InitMySQL initializes the database connection pool.
func InitMySQL(dataSourceName string) {
	var err error
	// Open a new database connection.
	// The sql.Open function just validates its arguments, it doesn't actually try to connect to the database.
	// The connection is established lazily, when it's first needed.
	DB, err = sql.Open("mysql", dataSourceName)
	if err != nil {
		log.Fatalf("Error opening database: %v", err)
	}

	// Ping the database to verify the connection.
	err = DB.Ping()
	if err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}

	// Set connection pool parameters.
	DB.SetMaxOpenConns(25)                 // Maximum number of open connections to the database.
	DB.SetMaxIdleConns(25)                 // Maximum number of connections in the idle connection pool.
	DB.SetConnMaxLifetime(5 * time.Minute) // Maximum amount of time a connection may be reused.

	fmt.Println("Successfully connected to MySQL database!")
}

// CloseMySQL closes the database connection.
// It's important to close the database connection when the application shuts down.
func CloseMySQL() {
	if DB != nil {
		err := DB.Close()
		if err != nil {
			log.Printf("Error closing database: %v", err)
		} else {
			fmt.Println("Database connection closed.")
		}
	}
}
