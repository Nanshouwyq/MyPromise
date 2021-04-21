// promise 原理
const isFunction = variable => typeof variable === 'function'; // 判断是不是函数

const PENDING = 'PENDING'
const FULFILLED = 'FULFILLED'
const REJECTED = 'REJECTED'

class MyPromise {
    constructor(handle) { // promise 必须接受一个函数
        if (!isFunction(handle)) {
            throw new Error('MyPromise must accpet a function as a parameter')
        }
        this._status = PENDING; //初始状态 为pending
        this._value = undefined;
        this._fulfilledQueue = []; // 添加成功回调函数队列
        this._rejectedQueue = [];  // 添加失败回调函数队列
        try {
            console.log('--------handle....run----------')
            handle(this._resolve.bind(this), this._reject.bind(this));
        } catch (err) {
            this._reject(err)
        }
    }
    // resolve 函数
    _resolve(val) {
        console.log('---------------_resolve------------------');
        const run = () => {
            console.log('--------resolve....run----------')
            if (this._status !== PENDING) return;
            this._status = FULFILLED;
           
            // 依次执行成功队列中函数 并清空队列
            const runFulfilled = (value) => {                
                let cb;
                while (cb = this._fulfilledQueue.shift()) {
                    cb(value);
                }
            }
            // 依次执行失败队列中函数 并清空队列
            const runRejected = (error) => {
                let cb;
                while (cb = this._rejectedQueue.shift()) {
                    cb(error)
                }
            }
            if(val instanceof MyPromise){
                val.then(value=>{
                  this._value =value
                  runFulfilled(value)
                },err=>{
                    this._value =err;
                    runRejected(err)
                })
            }else {
                this._value =val;
                runFulfilled(val)
            } 
        }
      
        setTimeout(() => run(), 0)
    };
    // reject 函数
    _reject(err) {
        console.log('---------------_reject------------------');
        if (this._status !== PENDING) return;
        const run = () =>{
           this._status = REJECTED;
           this._value = err;
           let cb;
           while(cb =this._rejectedQueue.shift()){
             cb(err)
           }
        }     

        setTimeout(() => run(), 0)
    };
    // then 函数
    then(onFulfilled, onRejected) {
        console.log('--------then start----------')
        const { _value, _status } = this;     
        // 返回一个新的promise对象
        return new MyPromise((onFulfilledNext, onRejectedNext) => {
            //成功调用
            let fulfilled = value => {
                console.log('--------then fulfilled----------')
                try {
                    if (!isFunction(onFulfilled)) {
                        onFulfilledNext(value)
                    } else {
                        let res = onFulfilled(value);
                        if (res instanceof MyPromise) {
                            res.then(onFulfilledNext, onRejectedNext)
                        } else {
                            onFulfilledNext(res)
                        }
                    }
                } catch (err) {
                    onRejectedNext(err)
                }
            }
            let rejected = error => {
                console.log('--------then rejected----------')
                try {
                    if (!isFunction(onRejected)) {
                        onRejectedNext(error)
                    } else {
                        let res = onRejecte(error)
                        if (res instanceof MyPromise) {
                            res.then(onFulfilledNext, onRejectedNext)
                        } else {
                            onFulfilledNext(res)
                        }
                    }
                } catch (err) {
                    onRejectedNext(err)
                }
            }
            switch (_status) {
                case PENDING:
                    console.log('--------then switch PENDING----------')
                    console.log('onFulfilled'+ onFulfilled)
                    this._fulfilledQueue.push(onFulfilled);
                    this._rejectedQueue.push(onRejected);
                    break
                case FULFILLED:
                    console.log('--------then switch FULFILLED----------')
                    fulfilled(_value);
                    break
                case REJECTED:
                    console.log('--------then switch REJECTED----------')
                    rejected(_value);
                    break
            }
        })
    }
    // catch 函数
    catch(onRejected) {
        return this.then(undefined,onRejected)
    }
    // 添加静态resolve 方法
    static resolve(value) {
        // 参数为MyPromise实例
        if(value instanceof MyPromise) return value;
        return new MyPromise(resolve =>resolve(value))
    }
    // 添加静态reject方法
    static reject(value) {
        return new MyPromise((resolve,reject)=> reject(value));
    }
    // 添加静态 all 方法
    static all (list) {
        return new MyPromise ((resolve,reject)=>{
            /**
             * 返回值的集合
             */
            let values = []
            let count = 0
            for(let [i,p] of list.entries()){
                this.resolve(p).then(res=>{
                    values[i] =res;
                    count ++;
                    // 所有状态变为fulfilled 时返回MyPromise状态变为fulfilled 
                    if(count === list.length) resolve(values)
                },err =>{
                    // 有一个被rejected 时返回MyPromise 状态为rejected
                    reject(err)
                })
            }
        })
    };
    // finally
    finally (cb) {
        return this.then(
         value => MyPromise.resolve(cb()).then(()=>value),
         reason => MyPromise.resolve(cb()).then(()=>{
             throw reason
         })
        )
    };
}
const a1 = new MyPromise((resolve,reject)=>{
    console.log('----------------!!!!!!!!!!!!!!!!!!!!!!!!!!!----------------------------')
    setTimeout(()=>{
        resolve(2)
        
    },1000)
})
 a1.then(res=>{
   console.log(res);
   return new MyPromise((resolve,reject)=>{
       resolve(3)
   })
 },err=>{
     console.log('err'+res);
 }).then(res=>{
     console.log(res);
 })