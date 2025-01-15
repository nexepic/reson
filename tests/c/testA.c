#include <stdio.h>

// Function to print "Hello, World!" and some lines with even/odd checks
void print_hello_test_a1() {
    printf("Hello, World!\n");
    for (int i = 0; i < 5; i++) {
        printf("This is line %d\n", i);
        if (i % 2 == 0) {
            printf("Even number\n"); // Even number check
        } else {
            printf("Odd number\n"); // Odd number check
        }
    }
}

/*
 * Another function to print "Hello, World!" and some lines with even/odd checks
 * This function is similar to print_hello_test_a1
 */
void print_hello_test_a2() {
    printf("Hello, World!\n");
    for (int i = 0; i < 5; i++) {
        printf("This is line %d\n", i);
        if (i % 2 == 0) {
            printf("Even number\n"); // Even number check
        } else {
            printf("Odd number\n"); // Odd number check
        }
    }
}

int main() {
    print_hello_test_a1(); // Call the first test function
    print_hello_test_a2(); // Call the second test function
    return 0; // Return success
}