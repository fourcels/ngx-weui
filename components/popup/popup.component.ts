import { animate, state, style, transition, trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { Observable, Observer, Subscription } from 'rxjs';
import { PopupConfig } from './popup.config';

@Component({
  selector: 'weui-popup',
  exportAs: 'weuiPopup',
  templateUrl: './popup.component.html',
  animations: [
    trigger('visibility', [
      state('show', style({ opacity: 1 })),
      state('hide', style({ opacity: 0 })),
      transition('hide <=> show', [animate(200)]),
    ]),
  ],
  host: {
    '[hidden]': '!shown',
  },
  preserveWhitespaces: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class PopupComponent implements OnInit, OnDestroy, OnChanges {
  private observer: Observer<boolean>;
  shown: boolean = false;
  _shownAnt = false;

  /**
   * 配置项
   */
  @Input() config: PopupConfig;
  /** 取消回调 */
  @Output() readonly cancel = new EventEmitter();
  /** 确认回调 */
  @Output() readonly confirm = new EventEmitter();

  get _visibility(): string {
    return this._shownAnt ? 'show' : 'hide';
  }

  constructor(private DEF: PopupConfig, private cdr: ChangeDetectorRef) {}

  private parseConfig() {
    this.config = { ...this.DEF, ...this.config };
  }

  ngOnInit() {
    this.parseConfig();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.config) this.parseConfig();
  }

  /**
   * 显示，并支持订阅结果，如果点击取消值为false，反之 true
   */
  show(): Observable<boolean> {
    this.shown = true;
    setTimeout(() => {
      this._shownAnt = true;
      this.cdr.detectChanges();
    }, 10);
    return Observable.create((observer: Observer<boolean>) => {
      this.observer = observer;
    });
  }

  /**
   * 隐藏
   *
   * @param [is_backdrop] 是否从背景上点击(可选)
   */
  hide(is_backdrop?: boolean) {
    if (is_backdrop === true && this.config.backdrop === false) return false;

    this._shownAnt = false;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.shown = false;
    }, 300);
  }

  /** 关闭，等同 `hide()` 效果 */
  close() {
    this.hide(false);
  }

  _onCancel() {
    this.cancel.emit();
    this.hide(false);
    if (this.observer) {
      this.observer.next(false);
      this.observer.complete();
    }
    return false;
  }

  _onConfirm() {
    this.confirm.emit();
    this.hide(false);
    if (this.observer) {
      this.observer.next(true);
      this.observer.complete();
    }
    return false;
  }

  ngOnDestroy(): void {
    if (this.observer && this.observer instanceof Subscription) {
      (this.observer as Subscription).unsubscribe();
    }
  }
}
