public class Test {
    public static void printHello() {
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

    public static void printHelloAgain() {
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
        printHelloAgain();
    }
}