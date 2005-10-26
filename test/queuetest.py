#!/usr/local/bin/python

import threading
from threading import Thread
import Queue
import random
import mutex
import time

mutex = mutex.mutex()

def p(args):
	print args

def lock():
	mutex.lock(p, "Locking")

def unlock():
	mutex.unlock()

class Popper(Thread):
	def __init__(self, q):
		self.queue = q
		Thread.__init__(self)

	def run(self):
		while 1:
			lock()
			item = self.queue.get()
			print "(Popper) %s: got '%s'" % (threading.currentThread().getName(), item)
			unlock()

class Pusher(Thread):
	def __init__(self, q):
		lock()
		self.queue = q
		threading.Thread.__init__(self)
		unlock()

	def run(self):
		while 1:
			item = random.randint(0, 1000)
			print "(Pusher) %s: put '%s'\n" % (threading.currentThread().getName(), item),
			self.queue.put(item)
			time.sleep(1)


queue = Queue.Queue()

for i in range(10):
	Pusher(queue).start()

for i in range(3):
	Popper(queue).start()
