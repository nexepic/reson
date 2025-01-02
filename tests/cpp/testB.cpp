#include <iostream>

void long_repeated_function() {
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

void another_long_repeated_function_B() {
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
    long_repeated_function();
    another_long_repeated_function();
    return 0;
}