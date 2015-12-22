import time
import os

class Logger:

  def __init__(self, dir="out"):
    self.log = open(dir + "/output.log", 'w')

  def write(self, msg):
    print msg
    self.log.write(msg + "\n")

  def close(self):
    self.log.close()

  @staticmethod
  def getNewDir(dir="out"):
    d = dir + str(time.time())
    os.makedirs(d)
    return d