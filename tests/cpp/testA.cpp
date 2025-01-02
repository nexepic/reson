#include <iostream>

void print_hello() {
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

void print_hello_again() {
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
    print_hello();
    print_hello_again();
    another_long_repeated_function();
    return 0;
}