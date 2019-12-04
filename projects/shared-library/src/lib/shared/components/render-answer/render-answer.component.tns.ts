import { Component, Input, OnInit, SimpleChanges, OnChanges, Inject, PLATFORM_ID, Output, EventEmitter } from '@angular/core';
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
    @Input() theme: string;
    @Input() isGameAnswer: boolean;
    @Input() isRight;
    @Input() isWrong;
    @Input() doPlay;
    @Input() bgColor;
    @Output() calAnsHeight = new EventEmitter<number>();

    currentAnswer: Answer;
    scriptToGetHeight: string;
    htmlStartTag: string;
    htmlEndTag: string;
    answerHeight = 0;
    isAndroid = isAndroid;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        if (isPlatformBrowser(this.platformId) || isAndroid || isIOS) {
            this.scriptToGetHeight = `<script> var body = document.body, html = document.documentElement;
            var height = Math.max(body.scrollHeight, body.offsetHeight,
            html.clientHeight, html.scrollHeight, html.offsetHeight);
            document.location.href += "#" + height;
            </script><style>pre.ql-syntax { background-color: #23241f;overflow: visible;}</style>`;
            this.htmlStartTag =
                `<html><head><body style="font-size:12px; background-color:'#283b66'; 
            ${this.isGameAnswer ? 'font-weight: bold !important;' : ''}
        padding:10px 0;vertical-align: middle;text-align:center;"><meta name="viewport" content="width=device-width,
        initial-scale=1, maximum-scale=1.0, user-scalable=no"><script src="${externalUrl.hightlighJs}"></script>`;
            this.htmlEndTag =
                `<style> html {background:${this.theme === 'dark' ? '#283b66' : '#f7f7f7'};color:#000}}
            </style></body>
            <link rel="stylesheet" href="${externalUrl.katexCSS}" crossorigin="anonymous">
            <link rel="stylesheet" href="${externalUrl.hightlighCSS}" crossorigin="anonymous"></html>`;
            // Created new local answer object because here I am modifing answer object
        }

    }

    ngOnInit(): void {

        if (this.answer) {
            this.currentAnswer = { ...this.answer };
            if (this.bgColor && this.currentAnswer.isRichEditor) {
                const bgColor = this.currentAnswer.correct ?
                `background:${this.bgColor}!important;` : `background:#fff!important;`;
                this.currentAnswer.answerText =
                            `${this.htmlStartTag} ${this.currentAnswer.answerText}
                        <style> html {${bgColor}color:#212121 !important;font-size:17;}</style>
                         ${this.scriptToGetHeight}   ${this.htmlEndTag}`;
            }
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
                this.calAnsHeight.emit(this.answerHeight);
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
                        this.currentAnswer.answerText =
                            `${this.htmlStartTag}  ${this.currentAnswer.answerText}
                        <style> html {background:#d54937 !important;color:#ffffff !important;font-size:17;}</style> 
                        ${this.scriptToGetHeight}   ${this.htmlEndTag}`;
                    }
                }
                if (changes.isRight) {
                    if (changes.isRight.currentValue) {
                        // tslint:disable-next-line:max-line-length
                        this.currentAnswer.answerText =
                            `${this.htmlStartTag} ${this.currentAnswer.answerText}
                        <style> html {background:#71b02f!important;color:#ffffff !important;font-size:17;}</style>
                         ${this.scriptToGetHeight}   ${this.htmlEndTag}`;
                    }
                }
            }
        }

    }


}
