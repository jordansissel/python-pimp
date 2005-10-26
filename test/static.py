#!/usr/local/bin/python

class Foo:
	test = "happy test"

	def __init__(self):
		self.test = "foo"

a = Foo()

# These should be different
print a.test
print Foo.test
