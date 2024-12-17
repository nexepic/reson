#include <stdio.h>

void print_hello() {
    printf("Hello, World!\n");
    for (int i = 0; i < 5; i++) {
        printf("This is line %d\n", i);
        if (i % 2 == 0) {
            printf("Even number\n");
        } else {
            printf("Odd number\n");
        }
    }
}

void print_hello_again() {
    printf("Hello, World!\n");
    for (int i = 0; i < 5; i++) {
        printf("This is line %d\n", i);
        if (i % 2 == 0) {
            printf("Even number\n");
        } else {
            printf("Odd number\n");
        }
    }
}

int main() {
    print_hello();
    print_hello_again();
    return 0;
}