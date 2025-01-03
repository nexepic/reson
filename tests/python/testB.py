class TestB:
    @staticmethod
    def print_hello_test_b1():
        print("Hello, World!")
        for i in range(5):
            print(f"This is line {i}")
            if i % 2 == 0:
                print("Even number")
            else:
                print("Odd number")

    @staticmethod
    def print_hello_test_b2():
        print("Hello, World!")
        for i in range(5):
            print(f"This is line {i}")
            if i % 2 == 0:
                print("Even number")
            else:
                print("Odd number")
        print("End of printHello")

    @staticmethod
    def print_hello_test_b3():
        print("Hello, World!")
        for i in range(5):
            print(f"This is line {i}")
            if i % 2 == 0:
                print("Even number")
            else:
                print("Odd number")

    @staticmethod
    def main():
        TestB.print_hello_test_b1()
        TestB.print_hello_test_b2()
        TestB.print_hello_test_b3()

# Execute main method
TestB.main()