import os
import time


class Logger:

  def __init__(self, dir="../out"):
    self.log = open(dir + "/output.log", 'w')
    self.write("Logging to " + dir)

  def write(self, msg):
    print msg
    self.log.write(msg + "\n")

  def writelog(self, msg):
    self.log.write(msg + "\n")

  def close(self):
    self.log.close()

  @staticmethod
  def getNewDir(dir="out"):
    d = dir + str(time.time())
    os.makedirs(d)
    return d