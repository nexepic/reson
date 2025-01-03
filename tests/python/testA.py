class TestA:
    @staticmethod
    def print_hello_test_a1():
        print("Hello, World!")
        for i in range(5):
            print(f"This is line {i}")
            if i % 2 == 0:
                print("Even number")
            else:
                print("Odd number")

    @staticmethod
    def print_hello_test_a2():
        print("Hello, World!")
        for i in range(5):
            print(f"This is line {i}")
            if i % 2 == 0:
                print("Even number")
            else:
                print("Odd number")

    @staticmethod
    def main():
        TestA.print_hello_test_a1()
        TestA.print_hello_test_a2()

# Execute main method
TestA.main()