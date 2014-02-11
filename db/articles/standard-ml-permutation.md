Thought I'd share a sweet 5-line functional definition of a permutation. The idea behind a permutation is that the elements of the collection are combined in every order. A list of length n has n! permutations. 

```
permutation [1, 2, 3];
(* [[1,2,3],[2,1,3],[2,3,1],[1,3,2],[3,1,2],[3,2,1]] *)
```

To remain extra concise, I'm going to open up the List module, just so collection methods don't have to be prefixed like map or fold. 

```
open List;
```

The permutation function will use two helper methods. One to combine each letter in turn with the recursively generated permutation of the rest of the elements, and another to flatten the lists of interleaved permutations into the list of each permutation to be returned. 

```
interleave "cat" ["dog", "mouse"];
(* [ ["cat","dog","mouse"], ["dog","cat","mouse"], ["dog","mouse","cat"] ] *)

flatten [[1, 2], [3], [4]]; 
(* [1, 2, 3, 4] *)
```

One big point of functional languages is to define reusable methods once. By currying the interleave function, it can be passed into the higher-order function List.map partially applied to an element, and it will interleave that element into each list being mapped over. 

```
fun interleave x [] = [[x]]
  | interleave x (h::t) = (x::h::t)::(map (fn l => h::l) (interleave x t));

fun flatten ls = foldr op @ [] ls;

fun permutation [] = [nil]
  | permutation (h::t) = flatten (map (interleave h) (permutation t));
```

Took a while, but I am really warming up to Standard ML!