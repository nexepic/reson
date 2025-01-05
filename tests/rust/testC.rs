fn print_hello_test_c1() {
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

fn print_hello_test_c2() {
    println!("Hello, World!");
    for i in 0..5 {
        println!("This is line {}", i);
        if i % 2 == 0 {
            println!("Even number");
        } else {
            println!("Odd number");
        }
        println!("Current iteration: {}", i);
    }
    println!("End of printHelloAgain");
}

fn main() {
    print_hello_test_c1();
    print_hello_test_c2();
}