package main

import "fmt"

func printHelloTestA1() {
    fmt.Println("Hello, World!")
    for i := 0; i < 5; i++ {
        fmt.Printf("This is line %d\n", i)
        if i%2 == 0 {
            fmt.Println("Even number")
        } else {
            fmt.Println("Odd number")
        }
    }
}

func printHelloTestA2() {
    fmt.Println("Hello, World!")
    for i := 0; i < 5; i++ {
        fmt.Printf("This is line %d\n", i)
        if i%2 == 0 {
            fmt.Println("Even number")
        } else {
            fmt.Println("Odd number")
        }
    }
}

func main() {
    printHelloTestA1()
    printHelloTestA2()
}