/*
    This is a test file for testing the rust code.
    This file contains two functions that are identical except for the comments.
    The test will check if the two functions are identical.
*/
fn print_hello_test_a1() {
    println!("Hello, World!");
    for i in 0..5 {
        println!("This is line {}", i);
        if i % 2 == 0 {
            println!("Even number");
        } else {
            // This is an odd number
            println!("Odd number");
        }
    }
}

fn print_hello_test_a2() {
    println!("Hello, World!");
    // for loop
    for i in 0..5 {
        // print line number
        println!("This is line {}", i); // print line number
        if i % 2 == 0 {
            // even number
            println!("Even number");
        } else {
            // odd number
            println!("Odd number");
        }
    }
}

fn main() {
    print_hello_test_a1();
    print_hello_test_a2();
} 