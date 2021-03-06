const GAME_SIZE = 16;//2x16 memory
const POSSIBLE_CARDS = ['arch',
                        'ubuntu',
                        'gentoo',
                        'windows',
                        'apple',
                        'manjaro',
                        'centos',
                        'mint',
                        'debian',
                        'fedora',
                        'kali',
                        'android',
                        'suse',
                        'bsd',
                        'tux',
                        'raspbian'];
const getRandomInt = (theMin, theMax) => {
    return theMin + Math.floor(Math.random() * Math.floor(theMax));
}
function *randomUniqueGenerator(theMax) {
    let alreadyUsed = [];
    while(alreadyUsed.length < theMax){
        let next = getRandomInt(0,theMax);
        while(alreadyUsed.includes(next)){
            next = getRandomInt(0,theMax);
        }
        alreadyUsed.push(next);
        yield next;
    }
    return;
};

class Card{
    constructor(name, position){
        this._name = name;
        this._path = `assets/${name}.png`;
        this._position = position;
        this._found = false;
        this._partial = false;
        this._flash = false;
    }
    get name(){
        return this._name;
    }
    get path(){
        return this._path;
    }
    get flash(){
        return this._flash;
    }
    set flash(v){
        this._flash = v;
    }
    get found(){
        return this._found;
    }
    set found(v){
        this._found = v;
    }
    get partial(){
        return this._partial;
    }
    set partial(v){
        this._partial = v;
    }
    get position(){
        return this._position;
    }
    click(name = null){
        if(this._found)
            return 'no match';
        if(this._partial){
            this.partial = false;
            return 'no match';
        }
        if(name === null){
            this.partial = true;
            return 'partial';
        }
        else{
            if(this.name == name){
                this.found = true;
                return 'found';
            }
            else
                return 'no match';
        }
    }
}
class Memory{
    constructor(){
        this._cards = new Array();//array(card1, ... cardN)
        this._currentName = null;
        this._finished = false;
        this._foundSoFar = 0;
        this._tries = 0;
        this._sound = new Map();
        this._first = true;
        this.setupSound();
        this.shuffle();
    }
    shuffle(){
        this._finished = false;
        this._tries = 0;
        this._foundSoFar = 0;
        this._currentName = null;
        this._first = true;
        const it = randomUniqueGenerator(GAME_SIZE*2);
        let namesTaken = [];
        for(let i=0;i<GAME_SIZE;i++){
            let p1 = it.next().value;
            let p2 = it.next().value;
            let name = POSSIBLE_CARDS[getRandomInt(0, POSSIBLE_CARDS.length)];
            while(namesTaken.includes(name)){
                name = POSSIBLE_CARDS[getRandomInt(0, POSSIBLE_CARDS.length)];
            }
            namesTaken.push(name);
            let card1 = new Card(name, p1);
            let card2 = new Card(name, p2);
            this._cards[p1] = card1;
            this._cards[p2] = card2;
        }
        this.inforender();
    }
    setupSound(){
        const errS = document.createElement('audio');
        errS.src = 'assets/error.ogg';
        errS.type = 'audio/ogg';
        this._sound.set('error', errS);
    }
    click(id){
        if(id >= 0 && id < (GAME_SIZE*2)){
            this._tries+=1;
            let cname = null;
            if(this._currentName)
                cname = this._currentName.name;
            let ans = this._cards[id].click(cname);
            try{
                switch(ans){
                    case 'partial':
                        this._currentName = this._cards[id];
                    break;
                    case 'found':
                        this._foundSoFar+=1;
                        this._currentName.found = true;
                        this._cards[id].found = true;
                        this._currentName = null;
                    break;
                    case 'no match':
                        this._sound.get('error').play();
                        this.flash(id);
                        this._currentName.partial = false;
                        this._currentName = null;
                    break;
                    default:
                        this._currentName = null;
                    break;
                }
            }catch(err){
                this._currentName = null;
            }
            this.render();
            if(this._foundSoFar == GAME_SIZE){
                if( this._tries < localStorage.memory_hi_score)
                    localStorage.memory_hi_score = this._tries;
                this._finished = true;
                setTimeout(()=>{
                    this.render();
                }, 200);
            }
        }
    }
    flash(id){
        this._cards[id].flash = true;
        this.render();
        setTimeout(() => {
            this._cards[id].flash = false;
            this.render();
        }, 250);
    }
    render(){
        return new Promise( (resolve, reject)=>{
            this.inforender();
            let container = document.getElementById('gameContainer');
            container.innerHTML='';
            this._cards.map(e=>{
                let cd = document.createElement("div");
                cd.innerHTML = `<img src='${e.path}'></img>`;
                cd.classList.add('card');
                if(e.partial || e.found || e.flash)
                    cd.classList.add('found');
                else
                    cd.classList.add('back');
                const self = this;
                if(!e.found){
                    cd.addEventListener('click', function () {
                        self.click(e.position);
                    });
                }
                container.appendChild(cd);
            });
            if(this._finished){
                if(confirm('Game Over\nTry again ?')){
                    this._finished = false;
                    this._tries = 0;
                    this._foundSoFar = 0;
                    this.shuffle();
                    this.render();
                }else{
                    this._finished = false;
                    container.innerHTML = ``;
                }
            }
            resolve(true);
        });
    }
    inforender(){
        try{
            let box_cpt = document.getElementById('cptclick');
            let box_best = document.getElementById('bestScore');
            let box_remaining = document.getElementById('remaining');
            box_remaining.innerHTML = `${(GAME_SIZE - this._foundSoFar)} pair${(GAME_SIZE - this._foundSoFar)>1?'s':''} remaining`;
            box_remaining.classList.remove('empty');
            if(this._tries>0){
                box_cpt.innerHTML = `${this._tries} click${this._tries>1?'s':''}`;
                box_cpt.classList.remove('empty');
            }else
                box_cpt.classList.add('empty');
            if(localStorage.memory_hi_score){
                box_best.innerHTML = `Best : ${localStorage.memory_hi_score}`;
                box_best.classList.remove('empty');
            }else
                box_best.classList.add('empty');
        }catch(err){

        }
    }
}

const m = new Memory();
function start(){
    m.shuffle();
    m.render().then(()=>{
    }).catch(e=>console.error);
}