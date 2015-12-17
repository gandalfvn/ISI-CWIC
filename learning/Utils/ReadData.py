import copy
import math
import numpy as np
import json
import gzip
import random
from nltk.tokenize import TreebankWordTokenizer

class Data:

  @staticmethod
  def onehot(num, dim):
    """
    Creates an empty vector of dimentionality dim with a single unit activated
    :param dim: dimentionality of the vector
    :param num: which dimension should be turned on
    """
    v = [0] * dim
    v[num] = 1
    return v

  @staticmethod
  def extend(world, dim):
    while len(world) < dim:
      world.append(-1)
    return world

  @staticmethod
  def numbers(mat):
    """
    Convertes one hot vectors into a number based on the index
    :param mat: Input one hot vectors
    """
    num = []
    for vec in mat:
      n = 0
      for v in vec:
        if v == 1:
          num.append([n])
          break
        n += 1
    return np.array(num)

  @staticmethod
  def minibatch(arrays, batch_size=16):
    """
    Creates Minibatches of 16 data points
    :param arrays:  a list of datasets (train, test, ... )
    :param batch_size: Number of data points per batch
    """
    num_batches = len(arrays[0]) / batch_size
    minibatches = []
    for i in range(num_batches):
      minibatches.append([])
      for array in arrays:
        minibatches[len(minibatches)-1].append(array[i * batch_size:(i + 1) * batch_size])
    return minibatches

  @staticmethod
  def scrambled(arrays):
    random.seed(1292015)
    random.shuffle(arrays)
    return arrays

  @staticmethod
  def norm(vec, mu, sig):
    """
      Tom Paine:
      also, if you actually care about this regression being good
      I would suggest normalizing the input in the following way
      for each dimension, subtract its mean over the dataset
      and divide by (its std over the dataset + 1e-6)
      :param vec:   Original vector
      :param mu:    Mean
      :param sig:   Standard Deviation
    """
    nvec = []
    for i in range(len(vec)):
      nvec.append((vec[i] - mu[i]) / sig[i])
    return nvec

  def __init__(self, maxlines=1000000, sequence=False, separate=True, onehot=True):
    trainingfile_input  = "../Data/logos/Train.input.json.gz"
    trainingfile_output = "../Data/logos/Train.output.json.gz"
    testingfile_input   = "../Data/logos/Dev.input.orig.json.gz"
    testingfile_output  = "../Data/logos/Dev.output.orig.json.gz"

    self.TrainingInput = []
    self.TrainingOutput = []

    ## Build Vocabulary ##
    self.vocab = {"UNK": 0, "<s>": 1, "</s>": 2}
    self.ivocab = {0: "UNK", 1: "<s>", 2: "</s>"}
    count = 3
    longest_sentence = 0
    self.world_dim = 0
    linecount = 0
    for line in gzip.open(trainingfile_input, 'r'):
      if linecount < maxlines:
        j = json.loads(line)
        self.TrainingInput.append(j)
        spl = TreebankWordTokenizer().tokenize(j["text"])
        for word in spl:
          if word not in self.vocab:
            self.vocab[word] = count
            self.ivocab[count] = word
            count += 1
        if len(spl) > longest_sentence:
          longest_sentence = len(spl)
        if len(j["world"]) > self.world_dim:
          self.world_dim = len(j["world"])
        linecount += 1

    vocabsize = len(self.vocab)
    unk = [0] * len(self.vocab)
    unk[0] = 1
    self.start = [0] * len(self.vocab)
    self.start[1] = 1
    self.end = [0] * len(self.vocab)
    self.end[2] = 1

    print "Created Vocabulary: ", vocabsize
    ## Read Training Data ##

    ## Compute mean/std per dimension ##
    all_locations = [[]] * self.world_dim
    mean_world = []
    std_dev = []
    for j in self.TrainingInput:
      world = self.extend(j["world"], self.world_dim)
      for i in range(self.world_dim):
        all_locations[i].append(world[i])
    for i in range(self.world_dim):
      mean_world.append(sum(all_locations[i]) / len(all_locations[i]))
      std_dev.append(math.sqrt(sum([(v - mean_world[i]) ** 2 for v in all_locations[i]]) / len(all_locations[i])))

    locations = []
    utterances = []
    for j in self.TrainingInput:
      world = self.extend(j["world"], self.world_dim)
      words = TreebankWordTokenizer().tokenize(j["text"])
      representation = []
      for i in range(longest_sentence):
        if i < len(words):
          representation.append(self.onehot(self.vocab[words[i]], vocabsize))
        else:
          representation.append(unk)
      #world = self.norm(world, mean_world, std_dev)
      utterances.append(representation)
      locations.append(world)

    actions = []
    classes = []
    count = 0
    for line in gzip.open(trainingfile_output, 'r'):
      if count < maxlines:
        j = json.loads(line)
        self.TrainingOutput.append(j)
        actions.append(j["loc"])
        classes.append(self.onehot(j["id"], 21))
        count += 1
      else:
        break

    print "Read Train: ", len(locations)

    ## Read Test Data ## 
    self.TestingInput  = []      # For printing JSONs
    self.TestingOutput = []      # For printing JSONs

    locations_test = []
    utterances_test = []
    for line in gzip.open(testingfile_input, 'r'):
      j = json.loads(line)
      self.TestingInput.append(j)
      world = self.extend(j["world"], self.world_dim)
      words = TreebankWordTokenizer().tokenize(j["text"])
      representation = []
      for i in range(longest_sentence):
        if i < len(words) and words[i] in self.vocab:
          representation.append(self.onehot(self.vocab[words[i]], len(self.vocab)))
        else:
          representation.append(unk)
      utterances_test.append(representation)
      locations_test.append(world)

    actions_test = []
    classes_test = []
    for line in gzip.open(testingfile_output, 'r'):
      j = json.loads(line)
      self.TestingOutput.append(j)
      actions_test.append(j["loc"])
      classes_test.append(self.onehot(j["id"], 21))

    print "Read Test: ", len(locations_test)

    ## Data Representation  x  Sentence in Corpus
    # utterances:  words, 1hot
    # locations:   ~57 (3*19) x,y,z coordinates
    # classes:     1-hot ID \in {1,20}
    # actions:     new (x,y,z) location

    self.Train = {}
    self.Test = {}

    if sequence:
      self.Train["text"] = np.array(utterances)
      self.Train["world"] = np.array(locations)
      self.Train["classes"] = np.array(classes)
      self.Train["actions"] = np.array(actions)

      self.Test["text"] = np.array(utterances_test)
      self.Test["world"] = np.array(locations_test)
      self.Test["classes"] = np.array(classes_test)
      self.Test["actions"] = np.array(actions_test)
    else:
      # Flatten utterances
      collapsed = [[index for word in sentence for index in word] for sentence in utterances]
      collapsed_test = [[index for word in sentence for index in word] for sentence in utterances_test]

      if onehot and separate:
        self.Train["text"] = np.array(collapsed)
        self.Train["world"] = np.array(locations)
        self.Train["classes"] = np.array(classes)
        self.Train["actions"] = np.array(actions)

        self.Test["text"] = np.array(collapsed_test)
        self.Test["world"] = np.array(locations_test)
        self.Test["classes"] = np.array(classes_test)
        self.Test["actions"] = np.array(actions_test)
      elif onehot and not separate:
        self.Train["input"] = np.concatenate((np.array(collapsed), np.array(locations)), axis=1)
        self.Train["output"] = np.concatenate((np.array(classes), np.array(actions)), axis=1)

        self.Test["input"] = np.concatenate((np.array(collapsed_test), np.array(locations_test)), axis=1)
        self.Test["output"] = np.concatenate((np.array(classes_test), np.array(actions_test)), axis=1)
      elif not onehot and not separate:
        self.Train["input"] = np.concatenate((np.array(collapsed), np.array(locations)), axis=1)
        self.Train["output"] = np.concatenate((self.numbers(np.array(classes)), np.array(actions)), axis=1)

        self.Test["input"] = np.concatenate((np.array(collapsed_test), np.array(locations_test)), axis=1)
        self.Test["output"] = np.concatenate((self.numbers(np.array(classes_test)), np.array(actions_test)), axis=1)
      else:
        print "Fuck you"

    print "Converted Data"

  # We assume all blocks are the same size and shape
  shape = {"type": "cube","size": 0.5,"shape_params": {
      "side_length": "0.1524",
      "face_1": {"color": "blue","orientation": "1"},
      "face_2": {"color": "green","orientation": "1"},
      "face_3": {"color": "cyan","orientation": "1"},
      "face_4": {"color": "magenta","orientation": "1"},
      "face_5": {"color": "yellow","orientation": "1"},
      "face_6": {"color": "red","orientation": "2"}}}

  # Set of brands for labeling blocks
  brands = [
      'adidas', 'bmw', 'burger king', 'coca cola', 'esso',
      'heineken', 'hp', 'mcdonalds', 'mercedes benz', 'nvidia',
      'pepsi', 'shell', 'sri', 'starbucks', 'stella artois',
      'target', 'texaco', 'toyota', 'twitter', 'ups']

  def convert_to_world(self, locations):
    """
    Convert an array of locations into a JSON
    :param locations:
    :return:
    """
    # Assign a location to each block
    uniq_id = 0
    j = {"block_state":[]}
    for coord in range(len(locations)/3):
      x = locations[coord * 3]
      y = locations[coord * 3 + 1]
      z = locations[coord * 3 + 2]
      j["block_state"].append({"id": (coord + 1), "position": "%f,%f,%f" % (x, y, z)})
    return j

  def write_predictions(self, predictions, filename="predictions"):
    """
    Produce a series of JSONs with  (input, gold, predicted) and utterance
    :param predictions:   System's predictions
    :param filename:      Output filename
    :return:
    """
    f = open("../out/" + filename + ".json", 'w')
    l = []
    full = {"block_meta": {"blocks": []}}
    # Give each white square a block (and brand)
    for coord in range(self.world_dim / 3):
      full["block_meta"]["blocks"].append({"name": self.brands[coord], "id": (coord + 1), "shape": self.shape})
    full["block_meta"]["decoration"] = "logo"

    for i in range(len(predictions)):
      words = TreebankWordTokenizer().tokenize(self.TestingInput[i]["text"])
      j = {"utterance": [words]}
      plocations = copy.deepcopy(self.TestingInput[i]["world"])
      glocations = copy.deepcopy(self.TestingInput[i]["world"])
      j["start_state"] = self.convert_to_world(glocations)

      # Update location of predicted block
      prediction = predictions[i]
      plocations[(int(prediction[0]) - 1) * 3] = prediction[1]
      plocations[(int(prediction[0]) - 1) * 3 + 1] = prediction[2]
      plocations[(int(prediction[0]) - 1) * 3 + 2] = prediction[3]
      j["predicted_state"] = self.convert_to_world(plocations)

      # Update location of gold block
      action = self.TestingOutput[i]["loc"]
      blockID = self.TestingOutput[i]["id"]
      glocations[(blockID - 1) * 3] = float(action[0])
      glocations[(blockID - 1) * 3 + 1] = float(action[1])
      glocations[(blockID - 1) * 3 + 2] = float(action[2])
      j["gold_state"] = self.convert_to_world(glocations)

      l.append(j)
    full["predictions"] = l
    f.write(json.dumps(full) + "\n")
    f.close()

    # Simple human readable format
    out = open("../out/human." + filename + ".txt", 'w')
    for i in range(len(predictions)):
      out.write("%s\n" % str(predictions[i]))
    out.close()
