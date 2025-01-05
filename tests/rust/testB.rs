fn print_hello_test_b1() {
    println!("Hello, World!");
    for i in 0..5 {
        println!("This is line {}", i);
        if i % 2 == 0 {
            println!("Even number");
        } else {
            println!("Odd number");
        }
    }
}

fn print_hello_test_b2() {
    println!("Hello, World!");
    for i in 0..5 {
        println!("This is line {}", i);
        if i % 2 == 0 {
            println!("Even number");
        } else {
            println!("Odd number");
        }
    }
    println!("End of printHello");
}

fn print_hello_test_b3() {
    println!("Hello, World!");
    for i in 0..5 {
        println!("This is line {}", i);
        if i % 2 == 0 {
            println!("Even number");
        } else {
            println!("Odd number");
        }
    }
}

fn main() {
    print_hello_test_b1();
    print_hello_test_b2();
    print_hello_test_b3();
}