'use strict';

import {isFunction, isNodeDescendant} from './utils.mjs';

export class DomRadar
{
    constructor(scope = document, config = {childList: true, subtree: true}, armed = true)
    {
        this.scope = scope;
        this.config = config;
        this.onScan = null;
        this.onEnter = null;
        this.onLeave = null;
        this.onLoss = null;
        this.targets = [];

        this.observer = new MutationObserver((mutationList, observer) => {
            if (isFunction(this.onScan)) {
                this.onScan(mutationList, observer);
            }

            if (isFunction(this.onEnter)) {
                const entered = mutationList.filter(m => m.type === 'childList' && m.addedNodes.length);
                entered.length && this.onEnter(entered, mutationList, observer);
            }

            const left = mutationList.filter(m => m.type === 'childList' && m.removedNodes.length);
            if (left.length) {
                this.trackAllTargets();
                if (isFunction(this.onLeave)) {
                    this.onLeave(left, mutationList, observer);
                }
            }
        });

        if (armed) {
            this.arm();
        }
    }

    setScanHandler(callback)
    {
        this.onScan = callback;
    }

    setEnterHandler(callback)
    {
        this.onEnter = callback;
    }

    setLeaveHandler(callback)
    {
        this.onLeave = callback;
    }

    setLossHandler(callback)
    {
        this.onLoss = callback;
    }

    arm()
    {
        this.observer.observe(this.scope, this.config);
    }

    disarm()
    {
        this.observer.disconnect();
    }

    lockTarget(target)
    {
        if (!this.targets.includes(target)) {
            this.targets.push(target);
        }

        this.trackTarget(target);
    }

    unlockTarget(target)
    {
        this.targets = this.targets.filter(tracked => tracked === target);
    }

    trackTarget(target)
    {
        if (!this.isTargetWithinScope(target)) {
            this.loseTarget(target);
        }
    }

    trackAllTargets()
    {
        this.targets.forEach(target => this.trackTarget(target));
    }

    loseTarget(target)
    {
        this.unlockTarget(target);

        if (isFunction(this.onLoss)) {
            this.onLoss(target);
        }
    }

    isTargetWithinScope(target, scope = this.scope)
    {
        return isNodeDescendant(scope, target);
    }
}
