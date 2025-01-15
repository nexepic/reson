package main

import "fmt"

// Function to print "Hello, World!" and some lines with even/odd checks
func printHelloTestA1() {
    fmt.Println("Hello, World!") // Print greeting
    for i := 0; i < 5; i++ {
        fmt.Printf("This is line %d\n", i) // Print line number
        if i%2 == 0 {
            fmt.Println("Even number") // Even number check
        } else {
            fmt.Println("Odd number") // Odd number check
        }
    }
}

/*
 * Another function to print "Hello, World!" and some lines with even/odd checks
 * This function is similar to printHelloTestA1
 */
func printHelloTestA2() {
    fmt.Println("Hello, World!") // Print greeting
    for i := 0; i < 5; i++ {
        fmt.Printf("This is line %d\n", i) // Print line number
        if i%2 == 0 {
            fmt.Println("Even number") // Even number check
        } else {
            fmt.Println("Odd number") // Odd number check
        }
    }
}

// Main function to execute test functions
func main() {
    printHelloTestA1() // Call the first test function
    printHelloTestA2() // Call the second test function
}