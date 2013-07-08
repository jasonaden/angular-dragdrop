/**
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

/**
 * Implementing Drag and Drop functionality in AngularJS is easier than ever.
 * Demo: http://codef0rmer.github.com/angular-dragdrop/
 *
 * @version 1.0.0
 *
 * (c) 2013 Amit Gharat a.k.a codef0rmer <amit.2006.it@gmail.com> - amitgharat.wordpress.com
 */

var jqyoui = angular.module('ngDragDrop', []).service('ngDragDropService', ['$timeout', '$parse', function($timeout, $parse) {
  this.callEventCallback = function (scope, callbackName, event, ui) {
    if (!callbackName) {
      return;
    }
    var args = [event, ui];
    var match = callbackName.match(/^(.+)\((.+)\)$/);
    if (match !== null) {
      callbackName = match[1];
      values = eval('[' + match[0].replace(/^(.+)\(/, '').replace(/\)/, '') + ']');
      args.push.apply(args, values);
    }
    scope[callbackName].apply(scope, args);
  };

  this.invokeDrop = function ($draggable, $droppable, event, ui) {
    var dragModel = '', dropModel = '', dragSettings = {}, dropSettings = {}, jqyoui_pos = null, dragItem = {}, dropItem = {},
      dragModelValue, dropModelValue, $droppableDraggable = null, droppableScope = $droppable.scope(), draggableScope = $draggable.scope();

    dragModel = $draggable.attr('ng-model');
    dropModel = $droppable.attr('ng-model');
    dragModelValue = draggableScope.$eval(dragModel);
    dropModelValue = droppableScope.$eval(dropModel);

    $droppableDraggable = $droppable.find('[jqyoui-draggable]:last');
    dropSettings = droppableScope.$eval($droppable.attr('jqyoui-droppable')) || [];
    dragSettings = draggableScope.$eval($draggable.attr('jqyoui-draggable')) || [];

    jqyoui_pos = angular.isArray(dragModelValue) ? dragSettings.index : null;

    if (dragSettings.connectWith) {
      var connectedItems = $droppable.find(dragSettings.connectWith),
        dropPosition = connectedItems.length;
      if (connectedItems.length) {
        console.log(event.clientX);
        connectedItems.each(function (idx, item) {
          console.log($(item).offset().top);
          if (event.clientY > $(item).offset().top) {
            dropPosition = idx + 1;
            console.log(dropPosition);
          }
        })
      }

    }

    // Dragging from an array
    if (angular.isArray(dragModelValue)) {
      // Dragging multiple items
      if (angular.isArray(jqyoui_pos)) {
        // dragItem will be an array of the items being dragged
        dragItem = [];
        _.each(jqyoui_pos, function (idx) {
          dragItem.push(dragModelValue[idx]);
        });
      // dragging a single item
      } else {
        dragItem = dragModelValue[jqyoui_pos];
      }
    // Not dragging from an array
    } else {
      dragItem = dragModelValue;
    }

    if (angular.isArray(dropModelValue) && dropSettings && dropSettings.index !== undefined) {
      dropItem = dropModelValue[dropSettings.index];
    } else if (!angular.isArray(dropModelValue)) {
      dropItem = dropModelValue;
    } else {
      dropItem = {};
    }

    if (dragSettings.animate === true) {
      this.move($draggable, $droppableDraggable.length > 0 ? $droppableDraggable : $droppable, null, 'fast', dropSettings, null);
      this.move($droppableDraggable.length > 0 && !dropSettings.multiple ? $droppableDraggable : [], $draggable.parent('[jqyoui-droppable]'), jqyoui.startXY, 'fast', dropSettings, function() {
        $timeout(function() {
          // Do not move this into move() to avoid flickering issue
          $draggable.css({'position': 'relative', 'left': '', 'top': ''});
          $droppableDraggable.css({'position': 'relative', 'left': '', 'top': ''});

          this.mutateDraggable(draggableScope, dropSettings, dragSettings, dragModel, dropModel, dropItem, $draggable);
          this.mutateDroppable(droppableScope, dropSettings, dragSettings, dropModel, dragItem, jqyoui_pos);
          this.callEventCallback(droppableScope, dropSettings.onDrop, event, ui);
        }.bind(this));
      }.bind(this));
    } else {
      $timeout(function() {
        this.mutateDraggable(draggableScope, dropSettings, dragSettings, dragModel, dropModel, dropItem, $draggable);

        this.mutateDroppable(droppableScope, dropSettings, dragSettings, dropModel, dragItem, jqyoui_pos, dropPosition);
        this.callEventCallback(droppableScope, dropSettings.onDrop, event, ui);
      }.bind(this));
    }
  };

  // Used to move the element across the screen. Only used when animate === true
  this.move = function($fromEl, $toEl, toPos, duration, dropSettings, callback) {
    if ($fromEl.length === 0) {
      if (callback) {
        window.setTimeout(function() {
          callback();
        }, 300);
      }
      return false;
    }

    var zIndex = 9999,
      fromPos = $fromEl.offset(),
      wasVisible = $toEl && $toEl.is(':visible');

    if (toPos === null && $toEl.length > 0) {
      if ($toEl.attr('jqyoui-draggable') !== undefined && $toEl.attr('ng-model') !== undefined && $toEl.is(':visible') && dropSettings && dropSettings.multiple) {
        toPos = $toEl.offset();
        if (dropSettings.stack === false) {
          toPos.left+= $toEl.outerWidth(true);
        } else {
          toPos.top+= $toEl.outerHeight(true);
        }
      } else {
        toPos = $toEl.css({'visibility': 'hidden', 'display': 'block'}).offset();
        $toEl.css({'visibility': '','display': wasVisible ? '' : 'none'});
      }
    }

    $fromEl.css({'position': 'absolute', 'z-index': zIndex})
      .css(fromPos)
      .animate(toPos, duration, function() {
        if (callback) callback();
      });
  };

  this.mutateDroppable = function(scope, dropSettings, dragSettings, dropModel, dragItem, jqyoui_pos, dropPosition) {
    var dropModelValue = scope.$eval(dropModel);
    console.log('mutateDroppable', dragItem, scope);

    scope.__dragItem = dragItem;

    if (angular.isArray(dropModelValue)) {
      if (angular.isArray(dragItem)) {
        _.each(dragItem, function (item) {
          if (dragSettings.connectWith) {
            console.log('inside', dropPosition);
            dropModelValue.splice(dropPosition, 0, item);
            dropPosition++;
          } else {
            dropModelValue.push(item);
          }
        })
      } else if (dropSettings && dropSettings.index >= 0) {
        dropModelValue[dropSettings.index] = dragItem;
      } else {
        dropModelValue.push(dragItem);
      }
      if (dragSettings && dragSettings.placeholder === true) {
        dropModelValue[dropModelValue.length - 1]['jqyoui_pos'] = jqyoui_pos;
      }
    } else {
      $parse(dropModel + ' = __dragItem')(scope);
      if (dragSettings && dragSettings.placeholder === true) {
        dropModelValue['jqyoui_pos'] = jqyoui_pos;
      }
    }
  };

  this.mutateDraggable = function(scope /*draggableScope*/, dropSettings/*jqyoui-droppable*/, dragSettings/*jqyoui-draggable*/,
    dragModel/*element.ngModel*/, dropModel/*element.ngModel*/, dropItem/*dropModel*/, $draggable/*element*/) {
    var isEmpty = $.isEmptyObject(dropItem),
      dragModelValue = scope.$eval(dragModel);
    scope.__dropItem = dropItem;

    // placeholder can be true = leave the space occupied by empty dom element, or 'keep' = copy rather than move the draggable
    if (dragSettings && dragSettings.placeholder) {
      // placeholder = true
      if (dragSettings.placeholder !== 'keep'){
        if (angular.isArray(dragModelValue) && getDragged) {
          console.log('using getDragged method');
        // dragging an individual item from an array
        } else if (angular.isArray(dragModelValue) && dragSettings.index !== undefined) {
          // dragModelValue is the model we are dragging from
          // This is setting to basically an empty object because we have placeholder=true which keeps an empty container there
          dragModelValue[dragSettings.index] = dropItem;

        // dragging an item not from an array or without index property
        } else {
          $parse(dragModel + ' = __dropItem')(scope);
        }
      }
    // No placeholder
    } else {
      if (angular.isArray(dragModelValue)) {
        // This appears to be is we are not making a clone of the original item
        if (isEmpty) {
          // Redundant? Check again to make sure we are not using a placeholder value of true or 'keep' -- was already checked above
          if (dragSettings && ( dragSettings.placeholder !== true && dragSettings.placeholder !== 'keep' )) {
            // TODO: Add code for index === array
            if (angular.isArray(dragSettings.index)) {
              for (var i = dragSettings.index.length - 1 ; i >= 0 ; i--) {
                dragModelValue.splice(dragSettings.index[i], 1);
              }
            // jaden - Adding so that we do single items only when appropriate. Allows for multiple items to be dragged.
            } else if (!isNaN(parseInt(dragSettings.index))) {
              // Remove the dragged item from the array
              dragModelValue.splice(dragSettings.index, 1);
            }
          }
        // Appears to be for cloning the original item
        } else {
          dragModelValue[dragSettings.index] = dropItem;
        }
      } else {
        // Fix: LIST(object) to LIST(array) - model does not get updated using just scope[dragModel] = {...}
        // P.S.: Could not figure out why it happened
        $parse(dragModel + ' = __dropItem')(scope);
        if (scope.$parent) {
          $parse(dragModel + ' = __dropItem')(scope.$parent);
        }
      }
    }

    $draggable.css({'z-index': '', 'left': '', 'top': ''});
  };
}]).directive('jqyouiDraggable', ['ngDragDropService', function(ngDragDropService) {
  return {
    require: '?jqyouiDroppable',
    restrict: 'A',
    link: function(scope, element, attrs) {
      var dragSettings;
      var updateDraggable = function(newValue, oldValue) {
        if (newValue) {
          dragSettings = scope.$eval(element.attr('jqyoui-draggable')) || [];
          element
            .draggable({disabled: false})
            .draggable(scope.$eval(attrs.jqyouiOptions) || {})
            .draggable({
              start: function(event, ui) {
                $(this).css('z-index', 999999);
                jqyoui.startXY = $(this).offset();
                ngDragDropService.callEventCallback(scope, dragSettings.onStart, event, ui);
              },
              stop: function(event, ui) {
                ngDragDropService.callEventCallback(scope, dragSettings.onStop, event, ui);
              },
              drag: function(event, ui) {
                ngDragDropService.callEventCallback(scope, dragSettings.onDrag, event, ui);
              }
            });
        } else {
          element.draggable({disabled: true});
        }
      };
      scope.$watch(function() { return scope.$eval(attrs.drag); }, updateDraggable);
      updateDraggable();
    }
  };
  }]).directive('jqyouiDroppable', ['ngDragDropService', function(ngDragDropService) {
    return {
      restrict: 'A',
      priority: 1,
      link: function(scope, element, attrs) {
        var updateDroppable = function(newValue, oldValue) {
          if (newValue) {
            element
              .droppable({disabled: false})
              .droppable(scope.$eval(attrs.jqyouiOptions) || {})
              .droppable({
                over: function(event, ui) {
                  var dropSettings = scope.$eval(angular.element(this).attr('jqyoui-droppable')) || [];
                  ngDragDropService.callEventCallback(scope, dropSettings.onOver, event, ui);
                },
                out: function(event, ui) {
                  var dropSettings = scope.$eval(angular.element(this).attr('jqyoui-droppable')) || [];
                  ngDragDropService.callEventCallback(scope, dropSettings.onOut, event, ui);
                },
                drop: function(event, ui) {
                  ngDragDropService.invokeDrop(angular.element(ui.draggable), angular.element(this), event, ui);
                }
              });
          } else {
            element.droppable({disabled: true});
          }
        };

        scope.$watch(function() { return scope.$eval(attrs.drop); }, updateDroppable);
        updateDroppable();
      }
    };
  }]);