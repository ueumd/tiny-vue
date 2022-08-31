export let activeEffectScope = null
export class EffectScope {
  active = true
  parent = null
  effects = [] // 此scope记录的effect
  scopes = [] // effectScope 还有可能要收集子集的effectScope
  constructor(detached) {
    if (!detached && activeEffectScope) {
      activeEffectScope.scopes.push(this)
    }
  }
  run(fn) {
    if (this.active) {
      try {
        this.parent = activeEffectScope
        activeEffectScope = this

        return fn()
      } finally {
        activeEffectScope = this.parent
      }
    }
  }
  stop() {
    if (this.active) {
      this.effects.forEach(effect => {
        effect.stop()
      })
      this.scopes.forEach(scope => {
        scope.stop()
      })
      this.active = false
    }
  }
}
export function recordEffectScope(effect) {
  if (activeEffectScope && activeEffectScope.active) {
    activeEffectScope.effects.push(effect)
  }
}

export function effectScope(detached = false) {
  return new EffectScope(detached)
}
