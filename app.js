const CLUBS = '♣';
const SPADES = '♠';
const HEARTS = '♥';
const DIAMONDS = '♦';

const ACE = 'A';
const COLORS = [CLUBS, SPADES, HEARTS, DIAMONDS];
const NUMBERS = ['A', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CARDS = [];
const CARDS_IN_GAME = [];
const CARDS_IN_TARGET_ZONE = [];

let SECOND_CARD_LISTENER = null;

(function() {
    generateCardDeck();
    initNewCard();
    initSecondCard();
    initDropzones();
})();

function initDropzones () {
    let dropzones = document.querySelectorAll('.playing-field .slot');
    dropzones.forEach(function (zone) {
        zone.addEventListener('dragover', onDragOver);
        zone.addEventListener('drop', function (event) { onDrop(event, zone); });
    });

    dropzones = document.querySelectorAll('.target-zone .slot');
    dropzones.forEach(function (zone) {
        zone.addEventListener('dragover', onDragOver);
        zone.addEventListener('drop', function (event) { onDrop(event, zone); });
    });
}

function showRandomCard (card) {
    const randomCard = random(CARDS.filter(function (x) { return !CARDS_IN_GAME.includes(x); }));
    const color = randomCard.slice(0, 1);
    const number = randomCard.slice(1);

    const content = card.querySelector('.card__content');
    content.innerText = color + ' ' + number;
    card.setAttribute('id', randomCard);
    card.dataset.color = color;
    card.dataset.number = number;

    if (isRed(color)) {
        content.classList.add('card__content--red');
    } else {
        content.classList.add('card__content--black');
    }
}

function getCustomColor () {
    const colors = [CLUBS, SPADES, HEARTS, DIAMONDS];

    return random(colors);
}

function getCustomNumber () {
    return random(NUMBERS);
}

function random (list) {
    return list[Math.floor(Math.random() * list.length)]
}

function onDragStart (event) {
    event.dataTransfer.setData('text/plain', event.currentTarget.getAttribute('id'));
}

function onDragOver(event) {
    event.preventDefault();
}

function onDrop (event, dropzone) {
    const zoneColor = dropzone.dataset.color;
    const id = event.dataTransfer.getData('text');
    if (!id) {
        return;
    }

    const draggableElement = document.getElementById(id);
    const lastCard = dropzone.querySelector('.card:last-child');

    if (!cardIsValid(draggableElement, lastCard, zoneColor)) {
        return;
    }

    const dragSingleCard = isLastCardOfSlot(draggableElement);
    if (dragSingleCard) {
        const clone = draggableElement.cloneNode(true);
        clone.addEventListener('dragstart', onDragStart);
        draggableElement.remove();
        dropzone.appendChild(clone);
    } else {
        if (zoneColor) {
            return;
        }

        // Drag all cards from slot
        const slotCards = draggableElement.parentElement.querySelectorAll('.card');
        const reversedCards = [];

        for (let i = (slotCards.length - 1); i >= 0; i--) {
            reversedCards.push(slotCards[i]);
        }

        slotCards.forEach(function (slotCard) {
            const clone = slotCard.cloneNode(true);
            clone.addEventListener('dragstart', onDragStart);
            slotCard.remove();
            dropzone.appendChild(clone);
        });
    }

    event.dataTransfer.clearData();

    if (zoneColor) {
        CARDS_IN_TARGET_ZONE.push(id);
    }

    if (CARDS.length === CARDS_IN_TARGET_ZONE.length) {
        endGame();
        return;
    }

    if (!CARDS_IN_GAME.includes(id)) {
        addNewBareCard();
        initNewCard();
        initSecondCard();
    
        CARDS_IN_GAME.push(id);
    }

    if (CARDS.length === CARDS_IN_GAME.length) {
        endGame();
        return;
    }
}

function endGame () {
    if (document.querySelector('.card-deck')) {
        document.querySelector('.card-deck').remove();
    }
    alert('YOU WON!');
    location.reload();
}

function isLastCardOfSlot(draggableElement) {
    const slot = draggableElement.parentElement;
    const lastCard = slot.querySelector('.card:last-child');

    return draggableElement === lastCard;
}

function cardIsValid(newCard, lastCard, zoneColor) {
    if (!lastCard && !zoneColor) {
        // Drop any card on playfield if zone is empty
        return true;
    }

    if (!lastCard && zoneColor && zoneColor === newCard.dataset.color && newCard.dataset.number === ACE) {
        // Drop any ace in empty colored target zone
        return true;
    }

    if (!lastCard && zoneColor && zoneColor !== newCard.dataset.color) {
        // Tried to drop an ace of another color
        return false;
    }

    const newCardIndex = NUMBERS.findIndex(function (x) { return x === newCard.dataset.number; });
    const lastCardIndex = NUMBERS.findIndex(function (x) { return x === lastCard.dataset.number; });

    if (lastCard && zoneColor && zoneColor === newCard.dataset.color && (newCardIndex - 1) === lastCardIndex) {
        // Drop the next same colored card in target zone
        return true;
    }

    if (!zoneColor && ((isRed(lastCard.dataset.color) && isRed(newCard.dataset.color)) || (!isRed(lastCard.dataset.color) && !isRed(newCard.dataset.color)))) {
        // Drop any card on playfield if it has not the same color as the last card
        return false;
    }

    if ((newCardIndex + 1) !== lastCardIndex) {
        return false;
    }

    return true;
}

function isRed(color) {
    return [HEARTS, DIAMONDS].includes(color)
}

function addNewBareCard () {
    const cardDeck = document.querySelector('.card-deck');
    const bareCard = document.querySelector('.card-deck .card:first-child');
    const clone = bareCard.cloneNode(true);

    cardDeck.insertBefore(clone, bareCard);
}

function initNewCard () {
    const newCard = getLastCard();

    newCard.setAttribute('id', 'new-card');
    newCard.addEventListener('click', revealCard);

    getSecondCard().removeEventListener('click', SECOND_CARD_LISTENER);
}

function initSecondCard () {
    const card = getSecondCard();

    SECOND_CARD_LISTENER = card.addEventListener('click', function () {
        document.querySelector('.card-deck .card:last-child').remove();
        addNewBareCard();
        initNewCard();
        revealCard();
        initSecondCard();
    });
}

function getNewCard () {
    return document.getElementById('new-card');
}

function getSecondCard () {
    return document.querySelector('.card-deck .card:nth-child(2)');
}

function getLastCard () {
    return document.querySelector('.card-deck .card:last-child');
}

function revealCard () {
    const card = getNewCard();
    if (!card) {
        return;
    }

    if (card.getAttribute('draggable')) {
        return;
    }

    card.classList.remove("card__back");
    card.classList.add("card__front");
    card.setAttribute('draggable', true);

    showRandomCard(card);

    card.addEventListener('dragstart', onDragStart);
}

function generateCardDeck () {
    NUMBERS.forEach(function (number) {
        COLORS.forEach(function (color) {
            CARDS.push(color + number);
        });
    });
}
