/* eslint-disable class-methods-use-this,no-undef,no-param-reassign,no-underscore-dangle */
import { html, PolymerElement } from '@polymer/polymer';

/**
`myscript-text-exports` is a component to display `myscript-text-web` exports candidates.

    <myscript-text-exports
        exports="myscript-text-web.exports">
    </myscript-text-exports>

Custom property | Description | Default
----------------|-------------|----------
`--myscript-text-exports-color` | Text candidates color | #1580CD
`--myscript-text-exports-background-color` | Text candidates background color | #EDF0F2
`--myscript-text-exports-selected-color` | Selected candidate color | #FFFFFF
`--myscript-text-exports-selected-background-color` | Selected candidate background color | #1580CD
`--myscript-text-exports-predicted-color` | Candidate predicted part color | #73818C
`--myscript-text-exports-completed-color` | Candidate completed part color | #1A9FFF
*/

class MyScriptTextExports extends PolymerElement {
  static get template() {
    return html`
        <style>
            :host {
                --myscript-text-exports-color: #1580CD;
                --myscript-text-exports-background-color: #EDF0F2;
                --myscript-text-exports-selected-color: #FFFFFF;
                --myscript-text-exports-selected-background-color: #1580CD;
                --myscript-text-exports-predicted-color: #73818C;
                --myscript-text-exports-completed-color: #1A9FFF;

                --myscript-text-candidate: {
                    padding: .5rem .75rem;
                    margin: 0 .125rem;
                    border-radius: 3px;
                    cursor: pointer;
                    flex: 0 0 auto;
                };

                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                align-items: stretch;
                color: var(--myscript-text-exports-color);
                min-height: 60px;
            }

            #plaintext {
                flex-grow: 2;
                text-align: center;
                overflow: auto;
                padding: 5px 0;
            }

            #candidates {
                display: flex;
                align-items: center;
                overflow: auto;
                padding: 5px 0;
            }

            .text {
                color: var(--myscript-text-exports-color);
                background-color: var(--myscript-text-exports-background-color);
                @apply --myscript-text-candidate;
            }

            .text[selected] {
                color: var(--myscript-text-exports-selected-color);
                background: var(--myscript-text-exports-selected-background-color);
            }

            .candidate[selected] * {
                color: inherit;
                background-color: inherit;
            }

            .char.predicted {
                color: var(--myscript-text-exports-predicted-color, #73818C);
            }

            .char.completed {
                color: var(--myscript-text-exports-completed-color, #1A9FFF);
            }
        </style>
        
        <div id="plaintext">{{ _getPlainText(exports) }}</div>
        <div id="candidates">
            <template is="dom-if" if="[[ exports.CANDIDATES ]]">
                <!--WARN: templates needs to be inline to avoid carriage return after span-->
                <template is="dom-repeat" id="textCandidateList" items="[[ exports.CANDIDATES.textSegmentResult.candidates ]]" as="textCandidate" index-as="textIndex">
                    <span class\$="text {{ _getCandidateFlags(candidate) }}" selected\$="[[ _isSelected(textIndex, exports.CANDIDATES.textSegmentResult.selectedCandidateIdx) ]]" on-tap="_select">
                        <template is="dom-if" if="[[ !textCandidate.children ]]">
                                {{ textCandidate.label }}
                        </template>
                        <template is="dom-if" if="[[ textCandidate.children ]]"><!--WARN: templates needs to be inline to avoid carriage return after span-->
                            <template is="dom-repeat" id="wordCandidateList" items="[[ _getChildCandidates(textCandidate, exports, 'text') ]]" as="wordCandidate">
                                <span class\$="word {{ _getCandidateFlags(wordCandidate) }}">
                                    <template is="dom-if" if="[[ !wordCandidate.children ]]">
                                        {{ wordCandidate.label }}
                                    </template>
                                    <template is="dom-if" if="[[ wordCandidate.children ]]">
                                        <template is="dom-repeat" id="charCandidateList" items="[[ _getChildCandidates(wordCandidate, exports, 'word') ]]" as="charCandidate"><span class\$="char {{ _getCandidateFlags(charCandidate) }}">{{ charCandidate.label }}</span></template>
                                    </template>
                                </span>
                             </template>
                         </template>
                    </span>
                </template>
            </template>
        </div>`;
  }

  static get is() {
    return 'myscript-text-exports';
  }

  static get properties() {
    return {
      /**
           * Exports result.
           * @attribute exports
           * @type {Object<String, Object>}.
           */
      exports: {
        type: Object,
        notify: true
      }
    };
  }

  _getPlainText(exports) {
    if (exports) {
      if (exports.TEXT) {
        return exports.TEXT;
      }
      return exports['text/plain'];
    }
    return undefined;
  }

  /**
   * Select a new candidate
   * @param e
   */
  _select(e) {
    const exports = this.exports;
    if (exports.CANDIDATES) {
      exports.CANDIDATES.textSegmentResult.selectedCandidateIdx = e.model.textIndex;
      exports.TEXT = exports.CANDIDATES.textSegmentResult.candidates[exports.CANDIDATES.textSegmentResult.selectedCandidateIdx].label;
    }
    this.exports = {};
    this.exports = exports;
    this.dispatchEvent(new CustomEvent('change', {
      detail: {
        exports
      }
    }));
  }

  _isSelected(index, selectedIndex) {
    return index === selectedIndex;
  }

  _getChildSegments(candidate, exports, type) {
    const segments = [];

    function addSegment(child, segment) {
      if (segment.inkRanges === child.inkRanges) {
        segment.selectedCandidateIdx = child.selectedCandidateIdx;
        segments.push(segment);
      }
    }

    if (candidate.children) {
      candidate.children.forEach((child, index) => {
        if (type === 'text' &&
                  exports &&
                  exports.CANDIDATES &&
                  exports.CANDIDATES.wordSegments &&
                  exports.CANDIDATES.wordSegments.length > -1) {
          exports.CANDIDATES.wordSegments.forEach(segment => addSegment(child, segment));
        } else if (type === 'word' &&
                  exports &&
                  exports.CANDIDATES &&
                  exports.CANDIDATES.charSegments &&
                  exports.CANDIDATES.charSegments.length > -1) {
          if (!child.inkRanges) {
            segments.push({
              candidates: [{
                label: candidate.label.charAt(index),
                flags: candidate.flags
              }],
              selectedCandidateIdx: 0
            });
          } else {
            exports.CANDIDATES.charSegments.forEach(segment => addSegment(child, segment));
          }
        }
      });
    }
    return segments;
  }

  _getChildCandidates(candidate, exports, type) {
    return this._getChildSegments(candidate, exports, type)
      .map(segment => segment.candidates[segment.selectedCandidateIdx]);
  }

  _getCandidateFlags(candidate) {
    if (candidate && candidate.flags) {
      return candidate.flags.join(' ').toLowerCase();
    }
    return '';
  }
}

customElements.define(MyScriptTextExports.is, MyScriptTextExports);
