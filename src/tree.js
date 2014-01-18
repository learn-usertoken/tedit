/*global define*/
define("tree", function () {
  "use strict";

  var $ = require('elements');
  var Node = require('tree/node');
  var Dir = require('tree/dir');
  var File = require('tree/file');
  var SymLink = require('tree/link');
  var domBuilder = require('dombuilder');
  var modes = require('modes');
  var focused = false, oldSlider, wasClosed;
  var editor = require('editor');
  var slider = require('slider');

  Node.create = function (repo, name, mode, hash, parent) {
    var Constructor;
    if      (modes.isFile(mode)) Constructor = File;
    else if (modes.isTree(mode)) Constructor = Dir;
    else if (modes.isSymLink(mode)) Constructor = SymLink;
    else throw new TypeError("Invalid mode 0" + mode.toString(8));
    if (Node.activatedPath === Node.calcPath(parent, name)) {
      var node = Node.activated;
      if (node.constructor !== Constructor) {
        Node.deactivate(Node.activated);
      }
      else {
        Constructor.apply(node, arguments);
        return node;
      }
    }
    return new Constructor(repo, name, mode, hash, parent);
  };

  Node.scrollTo = function (node) {
    var max = node.el.offsetTop;
    var min = max + node.rowEl.offsetHeight - $.tree.offsetHeight;
    var top = $.tree.scrollTop;
    if (top < min) $.tree.scrollTop = min;
    else if (top > max) $.tree.scrollTop = max;
  };

  var realBlur = editor.blur;
  editor.blur = function () {
    focused = true;
    if (!Node.selected) Node.select(Node.activated || Node.root);
    return realBlur.apply(this, arguments);
  };
  var realFocus = editor.focus;
  editor.focus = function () {
    focused = false;
    if (wasClosed) {
      wasClosed = false;
      slider.size = 0;
    }
    Node.select();
    return realFocus.apply(this, arguments);
  };

  Node.focus = function () {
    editor.blur();
  };

  Node.blur = function () {
    editor.focus();
  };

  function toggle() {
    if (focused) {
      oldSlider = slider.size;
      Node.blur();
    }
    else {
      wasClosed = slider.size < 100;
      if (wasClosed) slider.size = oldSlider || 200;
      Node.focus();
    }
  }

  window.addEventListener("keydown", function (evt) {
    // Ctrl-T
    if (evt.altKey && evt.keyCode === 84) {
      toggle();
    }
    else {
      if (!focused) return;
      if      (evt.keyCode === 33) Node.pageUp();
      else if (evt.keyCode === 34) Node.pageDown();
      else if (evt.keyCode === 35) Node.end();
      else if (evt.keyCode === 36) Node.home();
      else if (evt.keyCode === 37) Node.left();
      else if (evt.keyCode === 38) Node.up();
      else if (evt.keyCode === 39) Node.right();
      else if (evt.keyCode === 40) Node.down();

      else if (evt.keyCode === 13) { // Enter
        console.log("click", Node.selected)
        Node.click(Node.selected); // Hard click
      }
      else if (evt.keyCode === 32) { // Space
        console.log("soft click", Node.selected)
        Node.click(Node.selected, true); // Soft click
      }
      else return;
    }
    evt.preventDefault();
    evt.stopPropagation();
  }, true);


  require('repos')(function (err, repo, rootHash, entry) {
    if (err) throw err;
    repo.name = entry.fullPath;
    Node.root = Node.create(repo, entry.name, modes.tree, rootHash);
    $.tree.appendChild(domBuilder(["ul", Node.root.el]));
  });

  return {
    focus: Node.focus,
    blue: Node.blue,
    toggle: Node.toggle
  };
});
