const { applyToTextNodes } = require('./domHelpers');

const addNbspCs = (text) => {
  const replace = [
    [/(\s)K /g, '$1K '],
    [/(\s)k /g, '$1k '],
    [/(\s)S /g, '$1S '],
    [/(\s)s /g, '$1s '],
    [/(\s)V /g, '$1V '],
    [/(\s)v /g, '$1v '],
    [/(\s)Z /g, '$1Z '],
    [/(\s)z /g, '$1z '],
    [/(\s)O /g, '$1O '],
    [/(\s)o /g, '$1o '],
    [/(\s)U /g, '$1U '],
    [/(\s)u /g, '$1u '],
    [/(\s)A /g, '$1A '],
    [/(\s)I /g, '$1I '],
    [/(\s)i /g, '$1i '],

    [/(\s)j\. č\./g, '$1j. č.'],
    [/(\s)mn\. č\./g, '$1mn. č.'],
    [/(\s)n\. l\./g, '$1n. l.'],
    [/(\s)př\. n\. l\./g, '$1př. n. l.'],
    [/(\s)č\. p\./g, '$1č. p.'],
    [/(\s)t\. r\./g, '$1t. r.'],
    [/(\s)t\. č\./g, '$1t. č.'],
    [/(\s)v\. r\./g, '$1v. r.'],
    [/(\s)n\. m\./g, '$1n. m.'],
    [/(\s)tj\. /g, '$1tj. '],
    [/(\s)tzv\. /g, '$1tzv. '],

    [/(\s)s\. /g, '$1s. '],
    [/(\s)č\. /g, '$1č. '],
    [/(\s)s\. r\. o\./g, '$1s. r. o.'],
    [/(\s)r\. o\./g, '$1r. o.'],
    [/(\s)a\. s\./g, '$1a. s.'],
    [/(\s)k\. s\./g, '$1k. s.'],
    [/(\s)v\. o\. s\./g, '$1v. o. s.'],

    [/(\s)Bc\. /g, '$1Bc. '],
    [/(\s)Mgr\. /g, '$1Mgr. '],
    [/(\s)Ing\. /g, '$1Ing. '],
    [/(\s)Ph\.?D\. /g, '$1Ph.D. '],
    [/(\s)LL\.B\. /g, '$1LL.B. '],
    [/(\s)MUDr\. /g, '$1MUDr. '],
    [/(\s)prof\. /g, '$1prof. '],

    [/(\s)čet\. /g, '$1čet. '],
    [/(\s)rtm\. /g, '$1rtm. '],
    [/(\s)por\. /g, '$1por. '],
    [/(\s)kpt\. /g, '$1kpt. '],
    [/(\s)plk\. /g, '$1plk. '],
    [/(\s)gen\. /g, '$1gen. '],
  ];

  return replace.reduce((acc, item) => acc.replace(item[0], item[1].replace(/ /g, '&nbsp;')), text);
};

const domAddNbspCs = (dom) => {
  const body = dom.window.document.querySelector('body');
  applyToTextNodes(body)(addNbspCs);
};

module.exports = { domAddNbsp: domAddNbspCs };
