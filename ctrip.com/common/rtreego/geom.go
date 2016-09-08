// Copyright 2012 Daniel Connelly.  All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package rtreego

import (
	"fmt"
	"math"
	"strings"
)

// DimError represents a failure due to mismatched dimensions.
type DimError struct {
	Expected int
	Actual   int
}

func (err DimError) Error() string {
	return "rtreego: dimension mismatch"
}

// DistError is an improper distance measurement.  It implements the error
// and is generated when a distance-related assertion fails.
type DistError float64

func (err DistError) Error() string {
	return "rtreego: improper distance"
}

// Point represents a point in n-dimensional Euclidean space.
type Point []float64

func (p Point) String() string {
	if p == nil {
		return ""
	} else {
		return fmt.Sprintf("[%.6f,%.6f]", p[0], p[1])
	}
}

// Dist computes the Euclidean distance between two points p and q.
func (p Point) dist(q Point) float64 {
	if len(p) != len(q) {
		panic(DimError{len(p), len(q)})
	}
	sum := 0.0
	for i := range p {
		dx := p[i] - q[i]
		sum += dx * dx
	}
	return math.Sqrt(sum)
}

// minDist computes the square of the distance from a point to a rectangle.
// If the point is contained in the rectangle then the distance is zero.
//
// Implemented per Definition 2 of "Nearest Neighbor Queries" by
// N. Roussopoulos, S. Kelley and F. Vincent, ACM SIGMOD, pages 71-79, 1995.
func (p Point) minDist(r *Rect) float64 {
	if len(p) != len(r.P) {
		panic(DimError{len(p), len(r.P)})
	}

	sum := 0.0
	for i, pi := range p {
		if pi < r.P[i] {
			d := pi - r.P[i]
			sum += d * d
		} else if pi > r.Q[i] {
			d := pi - r.Q[i]
			sum += d * d
		} else {
			sum += 0
		}
	}
	return sum
}

// minMaxDist computes the minimum of the maximum distances from p to points
// on r.  If r is the bounding box of some geometric objects, then there is
// at least one object contained in r within minMaxDist(p, r) of p.
//
// Implemented per Definition 4 of "Nearest Neighbor Queries" by
// N. Roussopoulos, S. Kelley and F. Vincent, ACM SIGMOD, pages 71-79, 1995.
func (p Point) minMaxDist(r *Rect) float64 {
	if len(p) != len(r.P) {
		panic(DimError{len(p), len(r.P)})
	}

	// by definition, MinMaxDist(p, r) =
	// min{1<=k<=n}(|pk - rmk|^2 + sum{1<=i<=n, i != k}(|pi - rMi|^2))
	// where rmk and rMk are defined as follows:

	rm := func(k int) float64 {
		if p[k] <= (r.P[k]+r.Q[k])/2 {
			return r.P[k]
		}
		return r.Q[k]
	}

	rM := func(k int) float64 {
		if p[k] >= (r.P[k]+r.Q[k])/2 {
			return r.P[k]
		}
		return r.Q[k]
	}

	// This formula can be computed in linear time by precomputing
	// S = sum{1<=i<=n}(|pi - rMi|^2).

	S := 0.0
	for i := range p {
		d := p[i] - rM(i)
		S += d * d
	}

	// Compute MinMaxDist using the precomputed S.
	min := math.MaxFloat64
	for k := range p {
		d1 := p[k] - rM(k)
		d2 := p[k] - rm(k)
		d := S - d1*d1 + d2*d2
		if d < min {
			min = d
		}
	}

	return min
}

// Rect represents a subset of n-dimensional Euclidean space of the form
// [a1, b1] x [a2, b2] x ... x [an, bn], where ai < bi for all 1 <= i <= n.
type Rect struct {
	P, Q Point // Enforced by NewRect: p[i] <= q[i] for all i.
}

func (r *Rect) String() string {
	s := make([]string, len(r.P))
	for i, a := range r.P {
		b := r.Q[i]
		s[i] = fmt.Sprintf("[%.6f,%.6f]", a, b)
	}
	return strings.Join(s, "x")
}

func (r *Rect) Bounds() *Rect {
	return r
}

// NewRect constructs and returns a pointer to a Rect given a corner point and
// the lengths of each dimension.  The point p should be the most-negative point
// on the rectangle (in every dimension) and every length should be positive.
func NewRect(p Point, lengths []float64) (*Rect, error) {
	if len(p) != len(lengths) {
		return nil, &DimError{len(p), len(lengths)}
	}
	q := make([]float64, len(p))
	for i := range p {
		if lengths[i] <= 0 {
			return nil, DistError(lengths[i])
		}
		q[i] = p[i] + lengths[i]
	}
	return &Rect{p, q}, nil
}

// size computes the measure of a rectangle (the product of its side lengths).
func (r *Rect) size() float64 {
	size := 1.0
	for i, a := range r.P {
		b := r.Q[i]
		size *= b - a
	}
	return size
}

// margin computes the sum of the edge lengths of a rectangle.
func (r *Rect) margin() float64 {
	// The number of edges in an n-dimensional rectangle is n * 2^(n-1)
	// (http://en.wikipedia.org/wiki/Hypercube_graph).  Thus the number
	// of edges of length (ai - bi), where the rectangle is determined
	// by p = (a1, a2, ..., an) and q = (b1, b2, ..., bn), is 2^(n-1).
	//
	// The margin of the rectangle, then, is given by the formula
	// 2^(n-1) * [(b1 - a1) + (b2 - a2) + ... + (bn - an)].
	dim := len(r.P)
	sum := 0.0
	for i, a := range r.P {
		b := r.Q[i]
		sum += b - a
	}
	return math.Pow(2, float64(dim-1)) * sum
}

// containsPoint tests whether p is located inside or on the boundary of r.
func (r *Rect) containsPoint(p Point) bool {
	if len(p) != len(r.P) {
		panic(DimError{len(r.P), len(p)})
	}

	for i, a := range p {
		// p is contained in (or on) r if and only if p <= a <= q for
		// every dimension.
		if a < r.P[i] || a > r.Q[i] {
			return false
		}
	}

	return true
}

// containsRect tests whether r2 is is located inside r1.
func (r1 *Rect) containsRect(r2 *Rect) bool {
	if len(r1.P) != len(r2.P) {
		panic(DimError{len(r1.P), len(r2.P)})
	}

	for i, a1 := range r1.P {
		b1, a2, b2 := r1.Q[i], r2.P[i], r2.Q[i]
		// enforced by constructor: a1 <= b1 and a2 <= b2.
		// so containment holds if and only if a1 <= a2 <= b2 <= b1
		// for every dimension.
		if a1 > a2 || b2 > b1 {
			return false
		}
	}

	return true
}

// intersect computes the intersection of two rectangles.  If no intersection
// exists, the intersection is nil.
func intersect(r1, r2 *Rect) *Rect {
	dim := len(r1.P)
	if len(r2.P) != dim {
		panic(DimError{dim, len(r2.P)})
	}

	// There are four cases of overlap:
	//
	//     1.  a1------------b1
	//              a2------------b2
	//              p--------q
	//
	//     2.       a1------------b1
	//         a2------------b2
	//              p--------q
	//
	//     3.  a1-----------------b1
	//              a2-------b2
	//              p--------q
	//
	//     4.       a1-------b1
	//         a2-----------------b2
	//              p--------q
	//
	// Thus there are only two cases of non-overlap:
	//
	//     1. a1------b1
	//                    a2------b2
	//
	//     2.             a1------b1
	//        a2------b2
	//
	// Enforced by constructor: a1 <= b1 and a2 <= b2.  So we can just
	// check the endpoints.

	p := make([]float64, dim)
	q := make([]float64, dim)
	for i := range p {
		a1, b1, a2, b2 := r1.P[i], r1.Q[i], r2.P[i], r2.Q[i]
		if b2 <= a1 || b1 <= a2 {
			return nil
		}
		p[i] = math.Max(a1, a2)
		q[i] = math.Min(b1, b2)
	}
	return &Rect{p, q}
}

// ToRect constructs a rectangle containing p with side lengths 2*tol.
func (p Point) ToRect(tol float64) *Rect {
	dim := len(p)
	a, b := make([]float64, dim), make([]float64, dim)
	for i := range p {
		a[i] = p[i] - tol
		b[i] = p[i] + tol
	}
	return &Rect{a, b}
}

// boundingBox constructs the smallest rectangle containing both r1 and r2.
func boundingBox(r1, r2 *Rect) *Rect {
	dim := len(r1.P)
	if len(r2.P) != dim {
		panic(DimError{dim, len(r2.P)})
	}

	p := make([]float64, dim)
	lengths := make([]float64, dim)
	for i := range p {
		if r1.P[i] <= r2.P[i] {
			p[i] = r1.P[i]
		} else {
			p[i] = r2.P[i]
		}

		if r1.Q[i] <= r2.Q[i] {
			lengths[i] = r2.Q[i] - p[i]
		} else {
			lengths[i] = r1.Q[i] - p[i]
		}
	}

	r, _ := NewRect(p, lengths)
	return r
}

// boundingBoxN constructs the smallest rectangle containing all of r...
func boundingBoxN(rects ...*Rect) *Rect {
	if len(rects) == 1 {
		return rects[0]
	}
	bb := boundingBox(rects[0], rects[1])
	for _, rect := range rects[2:] {
		bb = boundingBox(bb, rect)
	}
	return bb
}
