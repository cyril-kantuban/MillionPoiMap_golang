// Copyright 2012 Daniel Connelly.  All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

// A library for efficiently storing and querying spatial data.
package rtreego

import (
	"fmt"
	"math"
	"sort"
)

// Rtree represents an R-tree, a balanced search tree for storing and querying
// spatial Objects.  Dim specifies the number of spatial dimensions and
// MinChildren/MaxChildren specify the minimum/maximum branching factors.
type Rtree struct {
	Dim         int
	MinChildren int
	MaxChildren int
	Root        *node
	Size        int
	Height      int
}

// NewTree creates a new R-tree instance.
func NewTree(Dim, MinChildren, MaxChildren int) *Rtree {
	rt := Rtree{Dim: Dim, MinChildren: MinChildren, MaxChildren: MaxChildren}
	rt.Height = 1
	rt.Root = &node{}
	rt.Root.Entries = []entry{}
	rt.Root.Leaf = true
	rt.Root.Level = 1
	return &rt
}

// Size returns the number of Objects currently stored in tree.
func (tree *Rtree) Length() int {
	return tree.Size
}

func (tree *Rtree) String() string {
	return "foo"
}

// Depth returns the maximum depth of tree.
func (tree *Rtree) Depth() int {
	return tree.Height
}

// node represents a tree node of an Rtree.
type node struct {
	Parent  *node
	Leaf    bool
	Entries []entry
	Level   int // node depth in the Rtree
}

func (n *node) String() string {
	return fmt.Sprintf("node{Leaf: %v, Entries: %v}", n.Leaf, n.Entries)
}

// entry represents a spatial index record stored in a tree node.
type entry struct {
	Bb    *Rect // bounding-box of all children of this entry
	Child *node
	Obj   Spatial
}

func (e entry) String() string {
	if e.Child != nil {
		return fmt.Sprintf("entry{Bb: %v, Child: %v}", e.Bb, e.Child)
	}
	return fmt.Sprintf("entry{Bb: %v, Obj: %v}", e.Bb, e.Obj)
}

// Any type that implements Spatial can be stored in an Rtree and queried.
type Spatial interface {
	Bounds() *Rect
}

// Insertion

// Insert inserts a spatial Object into the tree.  If insertion
// causes a Leaf node to overflow, the tree is rebalanced automatically.
//
// Implemented per Section 3.2 of "R-trees: A Dynamic Index Structure for
// Spatial Searching" by A. Guttman, Proceedings of ACM SIGMOD, p. 47-57, 1984.
func (tree *Rtree) Insert(Obj Spatial) {
	e := entry{Obj.Bounds(), nil, Obj}
	tree.insert(e, 1)
	tree.Size++
}

// insert adds the specified entry to the tree at the specified Level.
func (tree *Rtree) insert(e entry, Level int) {
	Leaf := tree.chooseNode(tree.Root, e, Level)
	Leaf.Entries = append(Leaf.Entries, e)

	// update Parent pointer if necessary
	if e.Child != nil {
		e.Child.Parent = Leaf
	}

	// split Leaf if overflows
	var split *node
	if len(Leaf.Entries) > tree.MaxChildren {
		Leaf, split = Leaf.split(tree.MinChildren)
	}
	Root, splitRoot := tree.adjustTree(Leaf, split)
	if splitRoot != nil {
		oldRoot := Root
		tree.Height++
		tree.Root = &node{
			Parent: nil,
			Level:  tree.Height,
			Entries: []entry{
				entry{Bb: oldRoot.computeBoundingBox(), Child: oldRoot},
				entry{Bb: splitRoot.computeBoundingBox(), Child: splitRoot},
			},
		}
		oldRoot.Parent = tree.Root
		splitRoot.Parent = tree.Root
	}
}

// chooseNode finds the node at the specified Level to which e should be added.
func (tree *Rtree) chooseNode(n *node, e entry, Level int) *node {
	if n.Leaf || n.Level == Level {
		return n
	}

	// find the entry whose Bb needs least enlargement to include Obj
	diff := math.MaxFloat64
	var chosen entry
	for _, en := range n.Entries {
		Bb := boundingBox(en.Bb, e.Bb)
		d := Bb.size() - en.Bb.size()
		if d < diff || (d == diff && en.Bb.size() < chosen.Bb.size()) {
			diff = d
			chosen = en
		}
	}

	return tree.chooseNode(chosen.Child, e, Level)
}

// adjustTree splits overflowing nodes and propagates the changes upwards.
func (tree *Rtree) adjustTree(n, nn *node) (*node, *node) {
	// Let the caller handle Root adjustments.
	if n == tree.Root {
		return n, nn
	}

	// Re-size the bounding box of n to account for lower-Level changes.
	en := n.getEntry()
	en.Bb = n.computeBoundingBox()

	// If nn is nil, then we're just propagating changes upwards.
	if nn == nil {
		return tree.adjustTree(n.Parent, nil)
	}

	// Otherwise, these are two nodes resulting from a split.
	// n was reused as the "left" node, but we need to add nn to n.Parent.
	enn := entry{nn.computeBoundingBox(), nn, nil}
	n.Parent.Entries = append(n.Parent.Entries, enn)

	// If the new entry overflows the Parent, split the Parent and propagate.
	if len(n.Parent.Entries) > tree.MaxChildren {
		return tree.adjustTree(n.Parent.split(tree.MinChildren))
	}

	// Otherwise keep propagating changes upwards.
	return tree.adjustTree(n.Parent, nil)
}

// getEntry returns a pointer to the entry for the node n from n's Parent.
func (n *node) getEntry() *entry {
	var e *entry
	for i := range n.Parent.Entries {
		if n.Parent.Entries[i].Child == n {
			e = &n.Parent.Entries[i]
			break
		}
	}
	return e
}

// computeBoundingBox finds the MBR of the Children of n.
func (n *node) computeBoundingBox() (Bb *Rect) {
	ChildBoxes := make([]*Rect, len(n.Entries))
	for i, e := range n.Entries {
		ChildBoxes[i] = e.Bb
	}
	Bb = boundingBoxN(ChildBoxes...)
	return
}

// split splits a node into two groups while attempting to minimize the
// bounding-box area of the resulting groups.
func (n *node) split(minGroupSize int) (left, right *node) {
	// find the initial split
	l, r := n.pickSeeds()
	leftSeed, rightSeed := n.Entries[l], n.Entries[r]

	// get the Entries to be divided between left and right
	remaining := append(n.Entries[:l], n.Entries[l+1:r]...)
	remaining = append(remaining, n.Entries[r+1:]...)

	// setup the new split nodes, but re-use n as the left node
	left = n
	left.Entries = []entry{leftSeed}
	right = &node{
		Parent:  n.Parent,
		Leaf:    n.Leaf,
		Level:   n.Level,
		Entries: []entry{rightSeed},
	}

	// TODO
	if rightSeed.Child != nil {
		rightSeed.Child.Parent = right
	}
	if leftSeed.Child != nil {
		leftSeed.Child.Parent = left
	}

	// distribute all of n's old Entries into left and right.
	for len(remaining) > 0 {
		next := pickNext(left, right, remaining)
		e := remaining[next]

		if len(remaining)+len(left.Entries) <= minGroupSize {
			assign(e, left)
		} else if len(remaining)+len(right.Entries) <= minGroupSize {
			assign(e, right)
		} else {
			assignGroup(e, left, right)
		}

		remaining = append(remaining[:next], remaining[next+1:]...)
	}

	return
}

func assign(e entry, group *node) {
	if e.Child != nil {
		e.Child.Parent = group
	}
	group.Entries = append(group.Entries, e)
}

// assignGroup chooses one of two groups to which a node should be added.
func assignGroup(e entry, left, right *node) {
	leftBB := left.computeBoundingBox()
	rightBB := right.computeBoundingBox()
	leftEnlarged := boundingBox(leftBB, e.Bb)
	rightEnlarged := boundingBox(rightBB, e.Bb)

	// first, choose the group that needs the least enlargement
	leftDiff := leftEnlarged.size() - leftBB.size()
	rightDiff := rightEnlarged.size() - rightBB.size()
	if diff := leftDiff - rightDiff; diff < 0 {
		assign(e, left)
		return
	} else if diff > 0 {
		assign(e, right)
		return
	}

	// next, choose the group that has smaller area
	if diff := leftBB.size() - rightBB.size(); diff < 0 {
		assign(e, left)
		return
	} else if diff > 0 {
		assign(e, right)
		return
	}

	// next, choose the group with fewer Entries
	if diff := len(left.Entries) - len(right.Entries); diff <= 0 {
		assign(e, left)
		return
	}
	assign(e, right)
}

// pickSeeds chooses two Child Entries of n to start a split.
func (n *node) pickSeeds() (int, int) {
	left, right := 0, 1
	maxWastedSpace := -1.0
	for i, e1 := range n.Entries {
		for j, e2 := range n.Entries[i+1:] {
			d := boundingBox(e1.Bb, e2.Bb).size() - e1.Bb.size() - e2.Bb.size()
			if d > maxWastedSpace {
				maxWastedSpace = d
				left, right = i, j+i+1
			}
		}
	}
	return left, right
}

// pickNext chooses an entry to be added to an entry group.
func pickNext(left, right *node, Entries []entry) (next int) {
	maxDiff := -1.0
	leftBB := left.computeBoundingBox()
	rightBB := right.computeBoundingBox()
	for i, e := range Entries {
		d1 := boundingBox(leftBB, e.Bb).size() - leftBB.size()
		d2 := boundingBox(rightBB, e.Bb).size() - rightBB.size()
		d := math.Abs(d1 - d2)
		if d > maxDiff {
			maxDiff = d
			next = i
		}
	}
	return
}

// Deletion

// Delete removes an Object from the tree.  If the Object is not found, returns
// false, otherwise returns true.
//
// Implemented per Section 3.3 of "R-trees: A Dynamic Index Structure for
// Spatial Searching" by A. Guttman, Proceedings of ACM SIGMOD, p. 47-57, 1984.
func (tree *Rtree) Delete(Obj Spatial) bool {
	n := tree.findLeaf(tree.Root, Obj)
	if n == nil {
		return false
	}

	ind := -1
	for i, e := range n.Entries {
		if e.Obj == Obj {
			ind = i
		}
	}
	if ind < 0 {
		return false
	}

	n.Entries = append(n.Entries[:ind], n.Entries[ind+1:]...)

	tree.condenseTree(n)
	tree.Size--

	if !tree.Root.Leaf && len(tree.Root.Entries) == 1 {
		tree.Root = tree.Root.Entries[0].Child
	}

	return true
}

// findLeaf finds the Leaf node containing Obj.
func (tree *Rtree) findLeaf(n *node, Obj Spatial) *node {
	if n.Leaf {
		return n
	}
	// if not Leaf, search all candidate subtrees
	for _, e := range n.Entries {
		if e.Bb.containsRect(Obj.Bounds()) {
			Leaf := tree.findLeaf(e.Child, Obj)
			if Leaf == nil {
				continue
			}
			// check if the Leaf actually contains the Object
			for _, leafEntry := range Leaf.Entries {
				if leafEntry.Obj == Obj {
					return Leaf
				}
			}
		}
	}
	return nil
}

// condenseTree deletes underflowing nodes and propagates the changes upwards.
func (tree *Rtree) condenseTree(n *node) {
	deleted := []*node{}

	for n != tree.Root {
		if len(n.Entries) < tree.MinChildren {
			// remove n from Parent Entries
			Entries := []entry{}
			for _, e := range n.Parent.Entries {
				if e.Child != n {
					Entries = append(Entries, e)
				}
			}
			if len(n.Parent.Entries) == len(Entries) {
				panic(fmt.Errorf("Failed to remove entry from Parent"))
			}
			n.Parent.Entries = Entries

			// only add n to deleted if it still has Children
			if len(n.Entries) > 0 {
				deleted = append(deleted, n)
			}
		} else {
			// just a Child entry deletion, no underflow
			n.getEntry().Bb = n.computeBoundingBox()
		}
		n = n.Parent
	}

	for _, n := range deleted {
		// reinsert entry so that it will remain at the same Level as before
		e := entry{n.computeBoundingBox(), n, nil}
		tree.insert(e, n.Level+1)
	}
}

// Searching

// SearchIntersectBB returns all Objects that intersect the specified rectangle.
//
// Implemented per Section 3.1 of "R-trees: A Dynamic Index Structure for
// Spatial Searching" by A. Guttman, Proceedings of ACM SIGMOD, p. 47-57, 1984.
func (tree *Rtree) SearchIntersect(Bb *Rect) []Spatial {
	return tree.searchIntersect(-1, tree.Root, Bb)
}

// SearchIntersectWithLimit is similar to SearchIntersect, but returns
// immediately when the first k results are found. A negative k behaves exactly
// like SearchIntersect and returns all the results.
func (tree *Rtree) SearchIntersectWithLimit(k int, Bb *Rect) []Spatial {
	return tree.searchIntersect(k, tree.Root, Bb)
}

func (tree *Rtree) searchIntersect(k int, n *node, Bb *Rect) []Spatial {
	results := []Spatial{}
	for _, e := range n.Entries {
		if k >= 0 && len(results) >= k {
			break
		}

		if intersect(e.Bb, Bb) != nil {
			if n.Leaf {
				results = append(results, e.Obj)
			} else {
				margin := k - len(results)
				results = append(results, tree.searchIntersect(margin, e.Child, Bb)...)
			}
		}
	}
	return results
}

// NearestNeighbor returns the closest Object to the specified point.
// Implemented per "Nearest Neighbor Queries" by Roussopoulos et al
func (tree *Rtree) NearestNeighbor(p Point) Spatial {
	Obj, _ := tree.nearestNeighbor(p, tree.Root, math.MaxFloat64, nil)
	return Obj
}

// utilities for sorting slices of Entries

type entrySlice struct {
	Entries []entry
	dists   []float64
	pt      Point
}

func (s entrySlice) Len() int { return len(s.Entries) }

func (s entrySlice) Swap(i, j int) {
	s.Entries[i], s.Entries[j] = s.Entries[j], s.Entries[i]
	s.dists[i], s.dists[j] = s.dists[j], s.dists[i]
}

func (s entrySlice) Less(i, j int) bool {
	return s.dists[i] < s.dists[j]
}

func sortEntries(p Point, Entries []entry) ([]entry, []float64) {
	sorted := make([]entry, len(Entries))
	dists := make([]float64, len(Entries))
	for i := 0; i < len(Entries); i++ {
		sorted[i] = Entries[i]
		dists[i] = p.minDist(Entries[i].Bb)
	}
	sort.Sort(entrySlice{sorted, dists, p})
	return sorted, dists
}

func pruneEntries(p Point, Entries []entry, minDists []float64) []entry {
	minMinMaxDist := math.MaxFloat64
	for i := range Entries {
		minMaxDist := p.minMaxDist(Entries[i].Bb)
		if minMaxDist < minMinMaxDist {
			minMinMaxDist = minMaxDist
		}
	}
	// remove all Entries with minDist > minMinMaxDist
	pruned := []entry{}
	for i := range Entries {
		if minDists[i] <= minMinMaxDist {
			pruned = append(pruned, Entries[i])
		}
	}
	return pruned
}

func (tree *Rtree) nearestNeighbor(p Point, n *node, d float64, nearest Spatial) (Spatial, float64) {
	if n.Leaf {
		for _, e := range n.Entries {
			dist := math.Sqrt(p.minDist(e.Bb))
			if dist < d {
				d = dist
				nearest = e.Obj
			}
		}
	} else {
		branches, dists := sortEntries(p, n.Entries)
		branches = pruneEntries(p, branches, dists)
		for _, e := range branches {
			subNearest, dist := tree.nearestNeighbor(p, e.Child, d, nearest)
			if dist < d {
				d = dist
				nearest = subNearest
			}
		}
	}

	return nearest, d
}

func (tree *Rtree) NearestNeighbors(k int, p Point) []Spatial {
	dists := make([]float64, k)
	Objs := make([]Spatial, k)
	for i := 0; i < k; i++ {
		dists[i] = math.MaxFloat64
		Objs[i] = nil
	}
	Objs, _ = tree.nearestNeighbors(k, p, tree.Root, dists, Objs)
	return Objs
}

// insert Obj into nearest and return the first k elements in increasing order.
func insertNearest(k int, dists []float64, nearest []Spatial, dist float64, Obj Spatial) ([]float64, []Spatial) {
	i := 0
	for i < k && dist >= dists[i] {
		i++
	}
	if i >= k {
		return dists, nearest
	}

	left, right := dists[:i], dists[i:k-1]
	updatedDists := make([]float64, k)
	copy(updatedDists, left)
	updatedDists[i] = dist
	copy(updatedDists[i+1:], right)

	leftObjs, rightObjs := nearest[:i], nearest[i:k-1]
	updatedNearest := make([]Spatial, k)
	copy(updatedNearest, leftObjs)
	updatedNearest[i] = Obj
	copy(updatedNearest[i+1:], rightObjs)

	return updatedDists, updatedNearest
}

func (tree *Rtree) nearestNeighbors(k int, p Point, n *node, dists []float64, nearest []Spatial) ([]Spatial, []float64) {
	if n.Leaf {
		for _, e := range n.Entries {
			dist := math.Sqrt(p.minDist(e.Bb))
			dists, nearest = insertNearest(k, dists, nearest, dist, e.Obj)
		}
	} else {
		branches, branchDists := sortEntries(p, n.Entries)
		branches = pruneEntries(p, branches, branchDists)
		for _, e := range branches {
			nearest, dists = tree.nearestNeighbors(k, p, e.Child, dists, nearest)
		}
	}
	return nearest, dists
}