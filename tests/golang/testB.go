package main

import "fmt"

func printHelloTestB1() {
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

func printHelloTestB2() {
    fmt.Println("Hello, World!")
    for i := 0; i < 5; i++ {
        fmt.Printf("This is line %d\n", i)
        if i%2 == 0 {
            fmt.Println("Even number")
        } else {
            fmt.Println("Odd number")
        }
    }
    fmt.Println("End of printHello")
}

func printHelloTestB3() {
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
    printHelloTestB1()
    printHelloTestB2()
    printHelloTestB3()
}