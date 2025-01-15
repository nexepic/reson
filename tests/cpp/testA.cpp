#include <iostream>

// Function to print "Hello, World!" and some lines with even/odd checks
void print_hello_test_a1() {
    std::cout << "Hello, World!" << std::endl;
    for (int i = 0; i < 5; i++) {
        std::cout << "This is line " << i << std::endl;
        if (i % 2 == 0) {
            std::cout << "Even number" << std::endl; // Even number check
        } else {
            std::cout << "Odd number" << std::endl; // Odd number check
        }
    }
}

/*
 * Another function to print "Hello, World!" and some lines with even/odd checks
 * This function is similar to print_hello_test_a1
 */
void print_hello_test_a2() {
    std::cout << "Hello, World!" << std::endl;
    for (int i = 0; i < 5; i++) {
        std::cout << "This is line " << i << std::endl;
        if (i % 2 == 0) {
            std::cout << "Even number" << std::endl; // Even number check
        } else {
            std::cout << "Odd number" << std::endl; // Odd number check
        }
    }
}

// Function to print "Hello, World!" and some lines with even/odd checks, and an end message
void print_hello_test_a3() {
    std::cout << "Hello, World!" << std::endl;
    for (int i = 0; i < 5; i++) {
        std::cout << "This is line " << i << std::endl;
        if (i % 2 == 0) {
            std::cout << "Even number" << std::endl; // Even number check
        } else {
            std::cout << "Odd number" << std::endl; // Odd number check
        }
    }
    std::cout << "End of function" << std::endl; // End message
}

int main() {
    print_hello_test_a1(); // Call the first test function
    print_hello_test_a2(); // Call the second test function
    print_hello_test_a3(); // Call the third test function
    return 0; // Return success
}