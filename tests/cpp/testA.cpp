#include <iostream>

void print_hello_test_a1() {
    std::cout << "Hello, World!" << std::endl;
    for (int i = 0; i < 5; i++) {
        std::cout << "This is line " << i << std::endl;
        if (i % 2 == 0) {
            std::cout << "Even number" << std::endl;
        } else {
            std::cout << "Odd number" << std::endl;
        }
    }
}

void print_hello_test_a2() {
    std::cout << "Hello, World!" << std::endl;
    for (int i = 0; i < 5; i++) {
        std::cout << "This is line " << i << std::endl;
        if (i % 2 == 0) {
            std::cout << "Even number" << std::endl;
        } else {
            std::cout << "Odd number" << std::endl;
        }
    }
}

void another_long_repeated_function_A() {
    std::cout << "Hello, World!" << std::endl;
    for (int i = 0; i < 5; i++) {
        std::cout << "This is line " << i << std::endl;
        if (i % 2 == 0) {
            std::cout << "Even number" << std::endl;
        } else {
            std::cout << "Odd number" << std::endl;
        }
    }
    std::cout << "End of function" << std::endl;
}

int main() {
    print_hello_test_a1();
    print_hello_test_a2();
    another_long_repeated_function();
    return 0;
}