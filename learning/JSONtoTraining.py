import json
import math
import random

random.seed(11032015)


############################ Vector Operations ################################
def vec(x, y):
  return [round(y[0] - x[0], 3), round(y[1] - x[1], 3), round(y[2] - x[2], 3)]


def angle(v):
  # If the vector has no magnitude
  if size(v) == 0:
    return 0
  # compute from [1,1,1] == acos(V.1 / |V||1|)
  # acos ( sum(V) / |V|*sqrt(3) )
  return round(math.acos(sum(v) / (size(v) * math.sqrt(3))), 2)


def strvec(x):
  return "%5.2f %5.2f %5.2f" % (x[0], x[1], x[2])


def size(vector):
  s = 0.0
  for v in vector:
    s += v ** 2
  return round(math.sqrt(s), 2)


def shrink(pos):
  return [0 if round(float(v), 4) == 0 else round(float(v), 4) for v in pos.split(",")[:3]]


############################ String Operations ################################

def clean_note(toclean):
  clean = toclean.lower()
  clean = clean.replace(", ", " , ")
  clean = clean.replace(".", " . ")
  clean = clean.replace(": ", " : ")
  clean += " "
  # for num in range(21):
  #  note = note.replace(" %d " % num, " _%d_ " % num)
  return clean


############################ State Encodings ##################################


# Concatenate the locations of all the blocks (in order)
def world(arr):
  w = ""
  for block in arr:
    w += "%5.2f %5.2f %5.2f " % (block[1][0], block[1][1], block[1][2])
  return w


# Action representation
def semantics(time_t, time_tp1):
  # Find the largest change
  maxval = 0
  maxrot = 0
  for b_id in range(len(time_t)):
    # If the state has changed
    if time_t[b_id] != time_tp1[b_id]:
      before = time_t[b_id]
      after = time_tp1[b_id]

      pos_dist = size(vec(before[1], after[1]))
      rot_dist = size(vec(before[2], after[2]))
      if pos_dist > maxval or rot_dist > maxval:
        changed = after
        maxrot = rot_dist
        maxval = max(pos_dist, maxrot)

  # If the rotation is insignificant, ignore it
  if maxrot < 0.1:
    return "%2d  %s   0.00  0.00  0.00" % (changed[0], strvec(changed[1]))
  # Otherwise, produce location and rotation
  return "%2d  %s  %s" % (changed[0], strvec(changed[1]), strvec(changed[2]))


############################ Generating New Examples ##########################

def shift(state, x, z):
  newstate = []
  for bid, pos, rot in state:
    newstate.append((bid, [pos[0] + x, pos[1], pos[2] + z], rot))
  return newstate


def displace(tuples):
  newtuples = []
  newtuples.extend(tuples)
  factor = 1
  while factor < 1000:
    print "Displacing: ", factor
    factor += 1
    x = random.random() - 0.5
    z = random.random() - 0.5
    for t in tuples:
      before = shift(t[0], x, z)
      after = shift(t[1], x, z)
      notes = t[2]
      newtuples.append((before, after, notes))
  print len(tuples), " -> ", len(newtuples)
  return newtuples


############################ Main Body ########################################

# Read all the annotations
notes = []
for i in range(0, 19):
  notes.append([])

Submitted = set()

m = 0
notes_json = json.load(open("TurkJobs/Task5_LogoNoSquare/notes.json", 'r'))
for person in notes_json["submitted"]:
  Submitted.add(person["name"])
for person in notes_json["notes"]:
  if person in Submitted:
    for stage in notes_json["notes"][person]:
      notes[int(stage)].extend(notes_json["notes"][person][stage])
      if int(stage) > m:
        m = int(stage)

m += 1
n = 0
notes_json = json.load(open("TurkJobs/Task6_LogoNoSquare/notes.json", 'r'))
for person in notes_json["submitted"]:
  Submitted.add(person["name"])
for person in notes_json["notes"]:
  if person in Submitted:
    for stage in notes_json["notes"][person]:
      notes[m + int(stage)].extend(notes_json["notes"][person][stage])
      if int(stage) > n:
        n = int(stage)

# Read the scene
scene_json = json.load(open("TurkJobs/Task6_LogoNoSquare/scene.json", 'r'))
states = []
for state in scene_json["block_states"]:
  current = []
  for block in state["block_state"]:
    if len(block["rotation"]) != 0:
      current.append((block["id"], shrink(block["position"]), shrink(block["rotation"])))
    else:
      current.append((block["id"], shrink(block["position"]), [0, 0, 0]))
  states.append(current)

# Reverse the order of the states
states = states[::-1]

tuples = []
# Create Pairs
for i in range(0, m + n):
  before = states[i]
  after = states[i + 1]
  tuples.append((before, after, notes[i]))

print "Read Data"

# Shift everything around on the board slightly to generate artificial data
newTuples = []
addDisplacement = True
if addDisplacement:
  newTuples = displace(tuples)

# Training Files
source = open("source.txt", 'w')
target = open("target.txt", 'w')
for before, after, noteArr in newTuples:
  sem = semantics(before, after)
  wod = world(before)
  for note in noteArr:
    source.write("%-80s     %s\n" % (clean_note(note), wod))
    target.write(sem + "\n")
source.close()
target.close()

# Training Files
source = open("source.orig.txt", 'w')
target = open("target.orig.txt", 'w')
for before, after, noteArr in tuples:
  sem = semantics(before, after)
  wod = world(before)
  for note in noteArr:
    source.write("%-80s     %s\n" % (clean_note(note), wod))
    target.write(sem + "\n")
source.close()
target.close()
