/**
 * PriorityQueue — Binary Min-Heap Implementation
 *
 * Used by: Dijkstra's algorithm (extracting minimum-distance node)
 *          Emergency triage (prioritizing hospitals by urgency score)
 *
 * Complexity:
 *   push()  — O(log n)  — sift up after append
 *   pop()   — O(log n)  — sift down after swap
 *   peek()  — O(1)      — read root
 *   size()  — O(1)
 *
 * Internal structure: zero-indexed array where:
 *   parent(i)      = Math.floor((i - 1) / 2)
 *   leftChild(i)   = 2*i + 1
 *   rightChild(i)  = 2*i + 2
 */
class PriorityQueue {
  constructor(comparator) {
    // Default comparator: min-heap by .priority field
    // Pass custom comparator for different ordering
    this._heap = [];
    this._comparator = comparator || ((a, b) => a.priority - b.priority);
  }

  /** Return number of elements in heap */
  size() {
    return this._heap.length;
  }

  /** Check if heap is empty */
  isEmpty() {
    return this._heap.length === 0;
  }

  /** View the minimum element without removing it — O(1) */
  peek() {
    return this._heap[0] || null;
  }

  /**
   * Insert element into heap — O(log n)
   * @param {*} item - any value; must match comparator signature
   */
  push(item) {
    this._heap.push(item);
    this._siftUp(this._heap.length - 1);
  }

  /**
   * Remove and return the minimum element — O(log n)
   * @returns {*} minimum element
   */
  pop() {
    if (this.isEmpty()) return null;

    const top = this._heap[0];
    const last = this._heap.pop();

    // If heap still has elements, place last at root and sift down
    if (this._heap.length > 0) {
      this._heap[0] = last;
      this._siftDown(0);
    }

    return top;
  }

  /**
   * Sift element up from index i to restore heap property
   * Called after push (new element at end)
   * @param {number} i - index to start sifting from
   */
  _siftUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      // If current element is less than parent, swap (min-heap)
      if (this._comparator(this._heap[i], this._heap[parent]) < 0) {
        this._swap(i, parent);
        i = parent;
      } else {
        break; // heap property restored
      }
    }
  }

  /**
   * Sift element down from index i to restore heap property
   * Called after pop (last element moved to root)
   * @param {number} i - index to start sifting from
   */
  _siftDown(i) {
    const n = this._heap.length;

    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;

      // Find the smallest among node and its children
      if (left < n && this._comparator(this._heap[left], this._heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < n && this._comparator(this._heap[right], this._heap[smallest]) < 0) {
        smallest = right;
      }

      if (smallest !== i) {
        this._swap(i, smallest);
        i = smallest;
      } else {
        break; // heap property restored
      }
    }
  }

  /** Swap two elements in heap array */
  _swap(i, j) {
    [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
  }

  /** Convert heap to sorted array (non-destructive) — O(n log n) */
  toSortedArray() {
    const copy = new PriorityQueue(this._comparator);
    copy._heap = [...this._heap];
    const result = [];
    while (!copy.isEmpty()) {
      result.push(copy.pop());
    }
    return result;
  }
}

module.exports = PriorityQueue;
