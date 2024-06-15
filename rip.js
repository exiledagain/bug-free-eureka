(async function () {
  'use strict'
  const waitFrames = n => new Promise(resolve => {
    if (n <= 0) {
      return
    }
    const recur = () => {
      if (n > 0) {
        n -= 1
        requestAnimationFrame(recur)
        return
      }
      resolve()
    }
    n -= 1
    requestAnimationFrame(recur)
  })
  const getProperty = root => {
    const stack = [root]
    let res = []
    while (stack.length > 0) {
      const el = stack.pop()
      if (el.nodeType === 3) {
        res.push(el.textContent)
      }
      if (el.style && el.style.display === 'none') {
        continue
      }
      if (el !== root && el.classList && el.classList.contains('text-gray-500')) {
        continue
      }
      el.childNodes.forEach(child => {
        stack.push(child)
      })
    }
    return res.reverse().join(' ').trim().replace(/\s\s+/g, ' ')
  }
  const getProperties = el => {
    return [...el.querySelectorAll('.property')].map(getProperty)
  }
  const getSocket = el => {
    return {
      name: el.querySelector('.socket-name').textContent,
      props: [...el.querySelectorAll('.property')].map(el => el.textContent)
    }
  }
  const getName = el => {
    return (el.children[0].style.display !== 'none' ? el.textContent : el.firstElementChild.nextSibling.textContent).trim().replace(/\s\s+/g, ' ')
  }
  const getItem = el => {
    const ancestor = el.parentElement.parentElement.parentElement
    const name = getName(el.children[0].children[0])
    const type = getProperty(el.children[1])
    const props = getProperties(el.querySelector('.properties'))
    const sockets = [...el.querySelectorAll('.socket')].map(getSocket)
    return {
      name,
      type,
      props,
      sockets,
      el,
      style: ancestor.parentElement.getAttribute('style')
    }
  }
  const tabs = document.querySelectorAll('.tab')
  if (tabs[0].textContent !== 'Character' || tabs[1].textContent !== 'Mercenary' || tabs[4].textContent !== 'I' || tabs[5].textContent !== 'II') {
    console.error('missing tabs')
    return
  }
  tabs[0].click()
  await waitFrames(2)
  tabs[4].click()
  await waitFrames(2)
  const character = {}
  character.name = document.querySelector('.xxl').textContent
  character.stats = [...document.querySelectorAll('.stat-box > div > div')].map(el => el.textContent)
  character.equipment = [...document.querySelectorAll('.item-column .popper .item .details')].map(getItem)
  character.inventory = [...document.querySelectorAll('.inventory .popper .item .details')].map(getItem)
  tabs[5].click()
  await waitFrames(2)
  character.swap = [...document.querySelectorAll('.item-box.weapon .popper .item .details')].map(getItem)
  tabs[1].click()
  await waitFrames(2)
  character.mercenary = {}
  character.mercenary.stats = [...document.querySelectorAll('.stat-box > div > div')].map(el => el.textContent)
  character.mercenary.equipment = [...document.querySelectorAll('.popper .item .details')].map(getItem)
  console.log(JSON.stringify(character))
})()
