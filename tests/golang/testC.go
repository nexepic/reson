package main

import "fmt"

func printHelloTestC1() {
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

func printHelloTestC2() {
    fmt.Println("Hello, World!")
    for i := 0; i < 5; i++ {
        fmt.Printf("This is line %d\n", i)
        if i%2 == 0 {
            fmt.Println("Even number")
        } else {
            fmt.Println("Odd number")
        }
        fmt.Printf("Current iteration: %d\n", i)
    }
    fmt.Println("End of printHelloAgain")
}

func main() {
    printHelloTestC1()
    printHelloTestC2()
}