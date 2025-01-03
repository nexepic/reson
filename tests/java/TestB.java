public class TestB {
    public static void printHelloTestB1() {
        System.out.println("Hello, World!");
        for (int i = 0; i < 5; i++) {
            System.out.println("This is line " + i);
            if (i % 2 == 0) {
                System.out.println("Even number");
            } else {
                System.out.println("Odd number");
            }
        }
    }

    public static void printHelloTestB2() {
        System.out.println("Hello, World!");
        for (int i = 0; i < 5; i++) {
            System.out.println("This is line " + i);
            if (i % 2 == 0) {
                System.out.println("Even number");
            } else {
                System.out.println("Odd number");
            }
        }
        System.out.println("End of printHello");
    }

    public static void printHelloTestB3() {
        System.out.println("Hello, World!");
        for (int i = 0; i < 5; i++) {
            System.out.println("This is line " + i);
            if (i % 2 == 0) {
                System.out.println("Even number");
            } else {
                System.out.println("Odd number");
            }
        }
    }

    public static void main(String[] args) {
        printHello();
        printHelloTestB1();
        printHelloTestB2();
        printHelloTestB3();
    }
}