import os,sys,math,random,json

# Set of brands for labeling blocks
brands = [ \
'adidas', 'bmw', 'burger king', 'coca cola', 'esso',  \
'heineken', 'hp', 'mcdonalds', 'mercedes benz', 'nvidia',  \
'pepsi', 'shell', 'sri', 'starbucks', 'stella artois',  \
'target', 'texaco', 'toyota', 'twitter', 'ups'];

# Check the number of non-zero (white) blocks
def size(arr):
  c = 0
  for coord in range(len(arr)):
    c += 1 if int(array[coord]) > 0 else 0
  return c

# We assume all blocks are the same size and shape
shape = {"type": "cube","size": 0.5,"shape_params": { \
          "side_length": "0.1524",  \
          "face_1": {"color": "blue","orientation": "1"}, \
          "face_2": {"color": "green","orientation": "1"}, \
          "face_3": {"color": "cyan","orientation": "1"}, \
          "face_4": {"color": "magenta","orientation": "1"},\
          "face_5": {"color": "yellow","orientation": "1"}, \
          "face_6": {"color": "red","orientation": "2"}}}

random.seed(10292015)

def furthest(xa, za, locations):
  ya = 0.1
  furthest =-1
  furthest_block = -1
  for (blockid,x,y,z) in locations:
    d = dist(xa,ya,za,x,y,z)
    if d > furthest:
      furthest = d
      furthest_block = blockid
  return furthest_block

def location(blockid, locations):
  for (bid,x,y,z) in locations:
    if blockid == bid:
      return (x,y,z)

def dist(ax,ay,az,x,y,z):
  return math.sqrt((ax-x)**2 + (ay-y)**2 + (az-z)**2)

def closest_block(anchor, moveable, locations):
  xa,ya,za = location(anchor, locations)
  smallest = 100
  smallest_block = -1
  for (blockid,x,y,z) in locations:
    if blockid in moveable:
      d = dist(xa,ya,za,x,y,z)
      if d < smallest:
        smallest = d
        smallest_block = blockid
  return smallest_block

def random_not_intersecting(locations):
  x = random.random()*2 - 1
  y = 0.1
  z = random.random()*2 - 1
  for block,bx,by,bz in locations:
    if dist(bx,by,bz,x,y,z) < 0.2:
      return random_not_intersecting(locations)
  return (x,y,z)

# Read in the ids for the images.
ids = []
for line in open("images_ids.txt",'r'):
  ids.append(line.split(".png")[0])

# Read one image array per line
arrays = []
for line in open("images_arrays.txt",'r'):
  arrays.append(line.strip().split(","))

# For each image
for i in range(len(ids)):
  imageID = ids[i]
  array   = arrays[i]
  if size(array) <= 20:
    uniq_id = 0
    f = open("unraveledJSONs/%s.json" % imageID,'w')
    j = {"block_meta":{"blocks":[]}}

    # Give each white square a block (and brand)
    for coord in range(len(array)):
      if int(array[coord]) > 0:
        j["block_meta"]["blocks"].append( {"name":brands[uniq_id], "id":(uniq_id+1), "shape": shape})
        uniq_id += 1

    # Assign a location to each block
    blocks = []
    tomove = []
    uniq_id = 0
    j["block_states"] =  [{"block_state":[]}]
    for coord in range(len(array)):
      r = coord / 14
      c = coord % 14
      if int(array[coord]) > 0:
        j["block_states"][0]["block_state"].append({"id":(uniq_id+1), "position":"%f,0.1,%f" % (2.0/3*(r - 6)/4, -2.0/3*(c - 6)/4)})
        blocks.append( (uniq_id + 1, 2.0/3*(r - 6)/4, 0.1, -2.0/3*(c - 6)/4) )
        tomove.append( uniq_id+1 )
        uniq_id += 1

    # Choose a random initial block
    #moving = tomove[random.randint(0,len(tomove)-1)]

    # Choose an "outlier" initial block
    average_x = 0
    average_z = 0
    for block,x,y,z in blocks:
      average_x += x
      average_z += z
    average_x /= len(blocks)
    average_z /= len(blocks)
    moving = furthest(average_x, average_z, blocks)

    tomove.remove(moving)
    # Unravel backwards
    while len(tomove) > 0:
      closest = closest_block(moving,tomove,blocks)
      (cx,cy,cz) = random_not_intersecting(blocks)
      j["block_states"].append({"block_state":[]})
      for i in range(len(blocks)):
        block,x,y,z = blocks[i]
        if block != closest:
          j["block_states"][len(j["block_states"])-1]["block_state"].append( \
              {"id": block, "position": "%f,%f,%f" % (x,y,z)})
        else:
          j["block_states"][len(j["block_states"])-1]["block_state"].append( \
              {"id": closest, "position": "%f,%f,%f" % (cx,cy,cz)})
          blocks[i] = (closest,cx,cy,cz)
      tomove.remove(closest)

    # Reverse the movements
    j["block_states"] = j["block_states"][::-1]
    f.write(json.dumps(j))
    f.close()
