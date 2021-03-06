import { Component, Input, OnInit, SimpleChanges, OnChanges, Inject, PLATFORM_ID } from '@angular/core';
import { Answer } from "shared-library/shared/model";
import { LoadEventData } from 'tns-core-modules/ui/web-view';
import { isAndroid, isIOS } from 'tns-core-modules/platform';
import { externalUrl } from './../../../environments/external-url';
import { isPlatformBrowser } from '@angular/common';

@Component({
    selector: 'render-answer',
    templateUrl: 'render-answer.component.html',
    styleUrls: ['render-answer.component.css']
})

export class RenderAnswerComponent implements OnInit, OnChanges {

    @Input() answer: Answer;
    @Input() questionIndex: number;
    @Input() isGameAnswer: boolean;
    @Input() isRight;
    @Input() isWrong;
    @Input() doPlay;

    currentAnswer: Answer;
    scriptToGetHeight: string;
    htmlStartTag: string;
    htmlEndTag: string;
    answerHeight = 0;
    isAndroid = isAndroid;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {

    }

    ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.scriptToGetHeight = `<script> var body = document.body, html = document.documentElement;
            var height = Math.max(body.scrollHeight, body.offsetHeight,
            html.clientHeight, html.scrollHeight, html.offsetHeight);
            document.location.href += "#" + height;
            </script><style>pre.ql-syntax { background-color: #23241f;overflow: visible;}</style>`;
            // tslint:disable-next-line:max-line-length
            this.htmlStartTag = `<html><head><body style="font-size:12px; ${this.isGameAnswer ? 'font-weight: bold !important;' : ''} padding:10px 0;vertical-align: middle;text-align:center;"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no">   <script src="${externalUrl.hightlighJs}"></script>`;
            // tslint:disable-next-line:max-line-length
            this.htmlEndTag = `</body><link rel="stylesheet" href="${externalUrl.katexCSS}" crossorigin="anonymous"><link rel="stylesheet" href="${externalUrl.hightlighCSS}" crossorigin="anonymous"></html>`;
            // Created new local answer object because here I am modifing answer object
        }

        if (this.answer) {
            this.currentAnswer = { ...this.answer };
        }
        if (this.currentAnswer && this.currentAnswer.isRichEditor) {
            // tslint:disable-next-line:max-line-length
            this.currentAnswer.answerText = this.htmlStartTag + this.currentAnswer.answerText + this.scriptToGetHeight + this.htmlEndTag;
        }
        if (!this.doPlay) {
            this.doPlay = false;
        }
    }
    /**
     *  Calculate lenght of webview for IOS
     * @param event:LoadEventData
     */
    onLoadFinished(event: LoadEventData) {
        if (isIOS && this.currentAnswer) {
            const height = event.url.split('#')[1];
            if (height) {
                this.answerHeight = parseInt(height, 10);
            }

        }
    }

    answerButtonClicked(answer: Answer) {
    }

    ngOnChanges(changes: SimpleChanges) {
        // Change background color of webview after answer given
        if (this.currentAnswer) {
            if (this.currentAnswer.isRichEditor) {
                if (changes.isWrong) {
                    if (changes.isWrong.currentValue) {
                        // tslint:disable-next-line:max-line-length
                        this.currentAnswer.answerText = `${this.htmlStartTag}  ${this.currentAnswer.answerText}   <style> html {background:#d54937;color:#ffffff;font-size:17;}</style> ${this.scriptToGetHeight}   ${this.htmlEndTag}`;
                    }
                }
                if (changes.isRight) {
                    if (changes.isRight.currentValue) {
                        // tslint:disable-next-line:max-line-length
                        this.currentAnswer.answerText = `${this.htmlStartTag} ${this.currentAnswer.answerText}   <style> html {background:#71b02f;color:#ffffff;font-size:17;}</style> ${this.scriptToGetHeight}   ${this.htmlEndTag}`;
                    }
                }
            }
        }

    }


}
