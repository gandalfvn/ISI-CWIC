import tensorflow as tf
import math


class Layers:
  """
  Helper class for quickly creating NN layers with differen initializations
  """

  @staticmethod
  def normal_W(input_dim=100, output_dim=100, name='Hidden'):
    return tf.Variable(tf.random_normal([input_dim, output_dim], stddev=1.0 / math.sqrt(input_dim), seed=12132015), name=name)
  @staticmethod
  def normal_b(dim=100, name='B'):
    return tf.Variable(tf.random_normal([dim], stddev=1.0 / math.sqrt(dim), seed=12132015), name=name)

  @staticmethod
  def uniform_W(input_dim=100, output_dim=100, name="Hidden"):
    return tf.Variable(tf.random_uniform([input_dim, output_dim], minval=-0.05, maxval=0.05, seed=12132015), name=name)

  @staticmethod
  def uniform_b(dim=100, name="B"):
    return tf.Variable(tf.random_uniform([dim], minval=-0.05, maxval=0.05, seed=12132015), name=name)

  @staticmethod
  def placeholder(dim, name):
    return tf.placeholder("float", shape=[None, dim], name=name)
