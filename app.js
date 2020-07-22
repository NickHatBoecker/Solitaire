const CLUBS = '♣';
const SPADES = '♠';
const HEARTS = '♥';
const DIAMONDS = '♦';

const COLORS = [CLUBS, SPADES, HEARTS, DIAMONDS];
const NUMBERS = ['A', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CARDS = []; // All available cards
const CARDS_IN_GAME = []; // All cards in the current game
const CARDS_IN_TARGET_ZONE = []; // All cards in the target zones

let SECOND_CARD_LISTENER = null;

(function () {
    generateCardDeck();
    updateCardDeck();
    initSecondCard();
    initDropzoneEvents();
})();

function generateCardDeck () {
    NUMBERS.forEach(function (number) {
        COLORS.forEach(function (color) {
            CARDS.push(color + number);
        });
    });
}

function initDropzoneEvents () {
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

function endGame () {
    if (document.querySelector('.card-deck')) {
        document.querySelector('.card-deck').remove();
    }
    alert('YOU WON!');
    location.reload();
}

function isLastCardOfSlot (draggableElement) {
    const slot = draggableElement.parentElement;
    const lastCard = slot.querySelector('.card:last-child');

    return draggableElement === lastCard;
}

function cardIsValid (newCard, lastCard, zoneColor) {
    if (!lastCard && !zoneColor) {
        // Drop any card on playfield if zone is empty
        return true;
    }

    if (!lastCard && zoneColor && zoneColor === newCard.dataset.color && isAce(newCard.dataset.number)) {
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

function updateCardDeck () {
    /**
     * Add a new covered card to the deck after the
     * open card was placed.
     */
    const cardDeck = document.querySelector('.card-deck');
    const bareCard = document.querySelector('.card-deck .card:first-child');
    const clone = bareCard.cloneNode(true);

    cardDeck.insertBefore(clone, bareCard);

    /**
     * Init new cards
     */
    const card = getLastCard();

    card.setAttribute('id', 'new-card');
    card.addEventListener('click', drawCard);

    getSecondCard().removeEventListener('click', SECOND_CARD_LISTENER);
}

function initSecondCard () {
    const card = getSecondCard();

    SECOND_CARD_LISTENER = card.addEventListener('click', function () {
        document.querySelector('.card-deck .card:last-child').remove();
        updateCardDeck();
        drawCard();
        initSecondCard();
    });
}

function drawCard () {
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

    card.addEventListener('dragstart', onDragStart);
}

/**
 * EVENT LISTENER
 */

function onDragStart (event) {
    event.dataTransfer.setData('text/plain', event.currentTarget.getAttribute('id'));
}

function onDragOver (event) {
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
        updateCardDeck();
        initSecondCard();
    
        CARDS_IN_GAME.push(id);
    }

    if (CARDS.length === CARDS_IN_GAME.length) {
        endGame();
        return;
    }
}

/**
 * HELPER FUNCTIONS
 */

function getCustomColor () {
    return random(COLORS);
}

function getCustomNumber () {
    return random(NUMBERS);
}

function random (list) {
    return list[Math.floor(Math.random() * list.length)];
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

function isRed (color) {
    return [HEARTS, DIAMONDS].includes(color);
}

function isAce (card) {
    return card === 'A';
}
