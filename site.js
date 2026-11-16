(function(){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };
  var real = function(v){ return v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); };
  var zap = function(texto){ return "https://wa.me/" + LOJA.whatsapp + "?text=" + encodeURIComponent(texto); };
  var esc = function(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); };
  var semAcento = function(s){ return String(s).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(); };
  var calmo = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var produto = function(id){ return PRODUTOS.find(function(p){ return p.id===id; }); };
  var parcelado = function(p){ return p.parcelas>1 ? "ou "+p.parcelas+"x de "+real(p.parcela) : "à vista"; };
  var temTam = function(p){ return !(p.tamanhos.length===1 && p.tamanhos[0]==="Único"); };

  /* medição de visitas e vendas: só liga se LOJA.ga4 ou LOJA.pixel estiverem preenchidos em loja.js */
  function carregar(src){ var sc=document.createElement("script"); sc.async=true; sc.src=src; document.head.appendChild(sc); }
  if(LOJA.ga4){ window.dataLayer=window.dataLayer||[]; window.gtag=function(){ window.dataLayer.push(arguments); }; window.gtag("js",new Date()); window.gtag("config",LOJA.ga4); carregar("https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(LOJA.ga4)); }
  if(LOJA.pixel){ var f=window.fbq=function(){ f.callMethod ? f.callMethod.apply(f,arguments) : f.queue.push(arguments); }; f.push=f; f.loaded=true; f.version="2.0"; f.queue=[]; carregar("https://connect.facebook.net/en_US/fbevents.js"); f("init",LOJA.pixel); f("track","PageView"); }
  function evento(nome,p,qtd){
    try{
      var item={item_id:p.id,item_name:p.nome,item_category:p.categoria,price:p.preco,quantity:qtd||1};
      if(window.gtag) window.gtag("event",nome,{currency:"BRL",value:p.preco*(qtd||1),items:[item]});
      if(window.fbq){ var n={view_item:"ViewContent",add_to_cart:"AddToCart"}[nome]; if(n) window.fbq("track",n,{content_ids:[p.id],content_type:"product",value:p.preco,currency:"BRL"}); }
    }catch(e){}
  }

  /* links fixos */
  document.querySelectorAll("[data-zap]").forEach(function(a){ a.href = zap(a.getAttribute("data-zap")); });
  $("link-mapa").href = LOJA.mapa; $("link-mapa2").href = LOJA.mapa; $("link-mapa3").href = LOJA.mapa;

  /* aberta ou fechada agora (horário da Bahia) */
  (function(){
    try{
      var partes = new Intl.DateTimeFormat("en-US",{timeZone:"America/Bahia",weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());
      var pega = function(t){ return partes.find(function(x){return x.type===t;}).value; };
      var dias = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], nomes = ["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
      var hoje = dias.indexOf(pega("weekday")), agora = (parseInt(pega("hour"),10)%24)*60 + parseInt(pega("minute"),10);
      var hora = function(m){ return Math.floor(m/60) + "h" + (m%60 ? String(m%60).padStart(2,"0") : ""); };
      var h = LOJA.horarios[dias[hoje]], el = $("estado");
      if(h && agora >= h[0] && agora < h[1]){ el.textContent = "Aberta agora · fecha às " + hora(h[1]); return; }
      el.classList.add("fechada");
      if(h && agora < h[0]){ el.textContent = "Fechada agora · abre hoje às " + hora(h[0]); return; }
      for(var i=1;i<=7;i++){ var d=(hoje+i)%7, hh=LOJA.horarios[dias[d]]; if(hh){ el.textContent = "Fechada agora · abre " + (i===1?"amanhã":nomes[d]) + " às " + hora(hh[0]); return; } }
    }catch(e){}
  })();

  /* inclinação 3D que segue o dedo ou o mouse */
  function inclinar(area, corpo){
    if(calmo) return;
    area.addEventListener("pointermove",function(e){
      var r=corpo.getBoundingClientRect(), x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
      x=Math.max(0,Math.min(1,x)); y=Math.max(0,Math.min(1,y));
      corpo.style.transform="rotateY("+((x-.5)*18).toFixed(1)+"deg) rotateX("+((.5-y)*14).toFixed(1)+"deg) translateZ(18px)";
      corpo.parentNode.style.setProperty("--gx",(x*100).toFixed(0)+"%"); corpo.parentNode.style.setProperty("--gy",(y*100).toFixed(0)+"%");
      corpo.style.setProperty("--gx",(x*100).toFixed(0)+"%"); corpo.style.setProperty("--gy",(y*100).toFixed(0)+"%");
    });
    area.addEventListener("pointerleave",function(){ corpo.style.transform=""; });
  }

  /* palco: carrossel 3D dos destaques */
  (function(){
    var lista=(LOJA.destaques||[]).map(produto).filter(Boolean);
    if(!lista.length) lista=PRODUTOS.slice(0,8);
    var palco=$("palco"), ativo=0, n=lista.length, timer=null;
    palco.innerHTML=lista.map(function(p,i){
      return '<button type="button" class="carta" data-i="'+i+'" aria-label="'+esc(p.nome+", "+(p.parcelas>1?p.parcelas+"x de "+real(p.parcela):real(p.preco)))+'">'+
        '<div class="corpo"><img src="'+esc(p.foto)+'" alt="" '+(i>1?'loading="lazy"':'')+'><div class="leg"><strong>'+esc(p.nome)+'</strong><span>'+esc(p.desc)+'</span></div><div class="brilho"></div></div>'+
        '<div class="selo-preco num">'+(p.parcelas>1 ? p.parcelas+'x de '+real(p.parcela)+'<small>total '+real(p.preco)+'</small>' : real(p.preco)+'<small>à vista</small>')+'</div></button>';
    }).join("");
    $("pontos").innerHTML=lista.map(function(){return "<i></i>";}).join("");
    var cartas=[].slice.call(palco.children), pontos=[].slice.call($("pontos").children);
    function arrumar(){
      var passo=Math.min(190, palco.clientWidth*0.36);
      cartas.forEach(function(c,i){
        var o=i-ativo; if(o>n/2) o-=n; if(o<-n/2) o+=n;
        var a=Math.abs(o);
        c.style.transform="translateX("+(o*passo)+"px) translateZ("+(-a*170)+"px) rotateY("+(o*-28)+"deg)";
        c.style.opacity=a>2?0:1; c.style.zIndex=String(20-a); c.style.pointerEvents=a>2?"none":"auto";
        c.classList.toggle("ativa",o===0); c.tabIndex=o===0?0:-1;
        if(o!==0) c.firstChild.style.transform="";
      });
      pontos.forEach(function(p,i){ p.className=i===ativo?"on":""; });
    }
    function ir(d){ ativo=(ativo+d+n)%n; arrumar(); }
    function tocar(){ parar(); if(!calmo) timer=setInterval(function(){ ir(1); },4500); }
    function parar(){ if(timer){ clearInterval(timer); timer=null; } }
    cartas.forEach(function(c){ inclinar(c,c.firstChild); });
    palco.addEventListener("click",function(e){
      var c=e.target.closest(".carta"); if(!c) return;
      var i=+c.getAttribute("data-i");
      if(i===ativo) abrirDetalhe(lista[i].id); else { ativo=i; arrumar(); }
    });
    $("palco-ant").addEventListener("click",function(){ ir(-1); tocar(); });
    $("palco-prox").addEventListener("click",function(){ ir(1); tocar(); });
    palco.addEventListener("keydown",function(e){ if(e.key==="ArrowLeft"){ ir(-1); } else if(e.key==="ArrowRight"){ ir(1); } });
    var x0=null;
    palco.addEventListener("pointerdown",function(e){ x0=e.clientX; });
    palco.addEventListener("pointerup",function(e){ if(x0===null) return; var dx=e.clientX-x0; x0=null; if(Math.abs(dx)>40){ ir(dx<0?1:-1); tocar(); } });
    palco.addEventListener("pointerenter",parar); palco.addEventListener("pointerleave",tocar);
    palco.addEventListener("focusin",parar); palco.addEventListener("focusout",tocar);
    window.addEventListener("resize",arrumar);
    arrumar(); tocar();
  })();

  /* sacola */
  var CHAVE = "ideal_sacola", sacola = [];
  try{ sacola = JSON.parse(localStorage.getItem(CHAVE)) || []; }catch(e){ sacola = []; }
  sacola = sacola.filter(function(i){ var p=produto(i.id); return p && p.tamanhos.indexOf(i.tam)>=0; });
  var salvar = function(){ try{ localStorage.setItem(CHAVE, JSON.stringify(sacola)); }catch(e){} };
  var totalSacola = function(){ return sacola.reduce(function(s,i){ return s + produto(i.id).preco*i.qtd; },0); };
  function adicionar(id,tam){
    var ja=sacola.find(function(i){return i.id===id && i.tam===tam;});
    if(ja) ja.qtd=Math.min(20,ja.qtd+1); else sacola.push({id:id,tam:tam,qtd:1});
    salvar(); desenharSacola(); $("sacola").showModal(); evento("add_to_cart",produto(id));
  }

  /* vitrine */
  var ORDEM=["Infantil","Feminino","Masculino","Calçados","Tênis","Bolsas e Carteiras","Perfumes","Relógios"];
  var categorias = PRODUTOS.map(function(p){return p.categoria;}).filter(function(c,i,a){return a.indexOf(c)===i;})
    .sort(function(a,b){ return (ORDEM.indexOf(a)+1||99)-(ORDEM.indexOf(b)+1||99); });
  var filtro = "Todos", sub = "Todos", termo = "";
  function cartao(p){
    var sel = temTam(p) ? '<select id="tam-'+p.id+'" aria-label="Tamanho de '+esc(p.nome)+'">'+p.tamanhos.map(function(t){return '<option value="'+esc(t)+'">'+esc(t)+'</option>';}).join("")+'</select>' : '';
    return '<article class="produto">'+
      '<button type="button" class="foto" data-ver="'+p.id+'" aria-label="Ver '+esc(p.nome)+' de perto"><img src="'+esc(p.foto)+'" alt="'+esc(p.nome+", "+p.desc)+'" loading="lazy"></button>'+
      '<div class="info"><div><h3>'+esc(p.nome)+'</h3><span class="pub">'+esc(p.desc)+'</span></div>'+
      '<div class="preco num">'+real(p.preco)+'<small>'+esc(parcelado(p))+'</small></div>'+
      '<div class="linha-compra">'+sel+'<button type="button" data-add="'+p.id+'">Adicionar</button></div></div></article>';
  }
  function desenharFiltros(){
    $("filtros").innerHTML = ["Todos"].concat(categorias).map(function(c){
      return '<button type="button" aria-pressed="'+(c===filtro)+'" data-cat="'+esc(c)+'">'+esc(c)+'</button>';
    }).join("");
    var subs = filtro==="Todos" ? [] : PRODUTOS.filter(function(p){return p.categoria===filtro;}).map(function(p){return p.sub;}).filter(function(c,i,a){return a.indexOf(c)===i;});
    $("subfiltros").hidden = subs.length<2;
    $("subfiltros").innerHTML = subs.length<2 ? "" : ["Todos"].concat(subs).map(function(c){
      return '<button type="button" aria-pressed="'+(c===sub)+'" data-sub="'+esc(c)+'">'+esc(c)+'</button>';
    }).join("");
  }
  function desenharVitrine(){
    var v=$("vitrine"), t=semAcento(termo.trim());
    if(t){
      var achados=PRODUTOS.filter(function(p){ return semAcento(p.nome+" "+p.desc+" "+p.categoria+" "+p.sub).indexOf(t)>=0; });
      v.innerHTML = achados.length ? '<div class="grade">'+ordenar(achados).map(cartao).join("")+'</div>' : '<p class="vazio">Não achei nada com esse nome. Tente outra palavra ou pergunte no WhatsApp.</p>';
      return;
    }
    if(filtro==="Todos"){
      v.innerHTML = categorias.map(function(c,k){
        var itens=PRODUTOS.filter(function(p){return p.categoria===c;});
        return '<section class="prateleira" aria-label="'+esc(c)+'"><header><h3>'+esc(c)+'</h3><span>'+itens.length+(itens.length===1?" produto":" produtos")+'</span>'+
          '<button type="button" class="ver" data-cat="'+esc(c)+'">Ver todos</button>'+
          '<div class="setas"><button type="button" data-rolar="-1" data-k="'+k+'" aria-label="Voltar em '+esc(c)+'">‹</button><button type="button" data-rolar="1" data-k="'+k+'" aria-label="Avançar em '+esc(c)+'">›</button></div></header>'+
          '<div class="trilho" id="trilho-'+k+'">'+ordenar(itens).slice(0,14).map(cartao).join("")+'</div></section>';
      }).join("");
      return;
    }
    var lista=PRODUTOS.filter(function(p){ return p.categoria===filtro && (sub==="Todos" || p.sub===sub); });
    v.innerHTML='<div class="grade">'+ordenar(lista).map(cartao).join("")+'</div>';
  }
  var ordem="";
  function ordenar(l){
    l=l.slice();
    if(ordem==="menor") l.sort(function(a,b){return a.preco-b.preco;});
    else if(ordem==="maior") l.sort(function(a,b){return b.preco-a.preco;});
    else if(ordem==="az") l.sort(function(a,b){return a.nome.localeCompare(b.nome,"pt-BR");});
    return l;
  }
  $("ordem").addEventListener("change",function(){ ordem=this.value; if(ordem && filtro==="Todos" && !termo.trim()){ /* nas prateleiras a ordem vale dentro de cada categoria */ } desenharVitrine(); });
  function escolher(c){ filtro=c; sub="Todos"; termo=""; $("busca").value=""; desenharFiltros(); desenharVitrine(); }
  $("filtros").addEventListener("click",function(e){ var b=e.target.closest("[data-cat]"); if(b) escolher(b.getAttribute("data-cat")); });
  $("subfiltros").addEventListener("click",function(e){ var b=e.target.closest("[data-sub]"); if(!b) return; sub=b.getAttribute("data-sub"); desenharFiltros(); desenharVitrine(); });
  $("busca").addEventListener("input",function(){ termo=this.value; desenharVitrine(); });
  $("vitrine").addEventListener("click",function(e){
    var b;
    if((b=e.target.closest("[data-add]"))){ var id=b.getAttribute("data-add"), s=$("tam-"+id); adicionar(id, s?s.value:"Único"); }
    else if((b=e.target.closest("[data-ver]"))){ abrirDetalhe(b.getAttribute("data-ver")); }
    else if((b=e.target.closest("[data-cat]"))){ escolher(b.getAttribute("data-cat")); $("produtos").scrollIntoView(); }
    else if((b=e.target.closest("[data-rolar]"))){ var tr=$("trilho-"+b.getAttribute("data-k")); tr.scrollBy({left:(+b.getAttribute("data-rolar"))*tr.clientWidth*0.8,behavior:calmo?"auto":"smooth"}); }
  });

  /* detalhe */
  var detId=null;
  function abrirDetalhe(id){
    var p=produto(id); if(!p) return; detId=id;
    $("det-img").src=p.foto; $("det-img").alt=p.nome+", "+p.desc;
    $("det-cat").textContent=p.categoria+" · "+p.sub; $("det-nome").textContent=p.nome; $("det-desc").textContent=p.desc;
    $("det-preco").innerHTML=real(p.preco)+"<small>"+esc(parcelado(p))+"</small>";
    $("det-tams-box").hidden=!temTam(p);
    $("det-tams").innerHTML=p.tamanhos.map(function(t,i){ return '<label><input type="radio" name="det-tam" value="'+esc(t)+'"'+(i===0?" checked":"")+'>'+esc(t)+'</label>'; }).join("");
    $("det-nota").textContent=(p.nota?p.nota+". ":"")+(temTam(p)?"Confirmamos a numeração disponível no WhatsApp.":"");
    $("det-zap").href=zap("Olá, Lojas Ideal! Vi no site: "+p.nome+" ("+p.desc+"), "+real(p.preco)+". Ainda tem?");
    var link=location.href.split("#")[0]+"#p-"+p.id;
    $("det-enviar").href="https://wa.me/?text="+encodeURIComponent("Olha o que eu vi na Lojas Ideal: "+p.nome+" ("+p.desc+"), "+(p.parcelas>1?p.parcelas+"x de "+real(p.parcela):real(p.preco))+"\n"+link);
    $("det-copiar").textContent="Copiar link"; $("det-copiar").onclick=function(){ var b=this; try{ navigator.clipboard.writeText(link).then(function(){ b.textContent="Link copiado"; },function(){ b.textContent="Não deu para copiar"; }); }catch(e){ b.textContent="Não deu para copiar"; } };
    $("detalhe").showModal(); evento("view_item",p);
  }
  function abrirPeloLink(){ var h=decodeURIComponent(location.hash||""); if(h.indexOf("#p-")===0 && produto(h.slice(3))) abrirDetalhe(h.slice(3)); }
  window.addEventListener("hashchange",abrirPeloLink);
  inclinar($("det-foto"), $("det-foto").firstChild);
  $("det-fechar").addEventListener("click",function(){ $("detalhe").close(); });
  $("detalhe").addEventListener("click",function(e){ if(e.target===$("detalhe")) $("detalhe").close(); });
  $("det-add").addEventListener("click",function(){
    var m=document.querySelector('input[name="det-tam"]:checked'); $("detalhe").close(); adicionar(detId, m?m.value:"Único");
  });

  /* gaveta */
  function rotulo(i){ var p=produto(i.id); return p.nome+" ("+p.desc+(i.tam!=="Único"?", tam. "+i.tam:"")+")"; }
  function textoPedido(){
    var linhas = sacola.map(function(i){ var p=produto(i.id); return "• "+i.qtd+"x "+rotulo(i)+" — "+real(p.preco*i.qtd); });
    var entrega = $("rec-entrega").checked;
    var t = "Olá, Lojas Ideal! Quero fechar este pedido do site:\n"+linhas.join("\n")+"\nTotal dos produtos: "+real(totalSacola())+"\n";
    t += entrega ? "Recebimento: entrega em "+($("endereco").value.trim()||"(vou informar o endereço)")+". Quero combinar o frete.\n" : "Recebimento: retirada na loja.\n";
    if($("nome").value.trim()) t += "Nome: "+$("nome").value.trim();
    return t;
  }
  function atualizarLinks(){ $("pedir-zap").href = zap(textoPedido()); $("campo-endereco").hidden = !$("rec-entrega").checked; }
  function desenharSacola(){
    var n = sacola.reduce(function(s,i){return s+i.qtd;},0);
    $("contador").textContent = n;
    var vazia = !sacola.length;
    $("dados").hidden = vazia; $("rodape").hidden = vazia;
    $("itens").innerHTML = vazia ? '<p class="vazia">Sua sacola está vazia. Escolha uma peça na vitrine.</p>' : sacola.map(function(i,k){
      var p=produto(i.id);
      return '<div class="item"><div><strong>'+esc(p.nome)+'</strong><div class="det">'+esc(p.desc)+(i.tam!=="Único"?' · tam. '+esc(i.tam):'')+'</div></div>'+
        '<strong class="num">'+real(p.preco*i.qtd)+'</strong>'+
        '<div class="qtds"><button type="button" data-menos="'+k+'" aria-label="Diminuir quantidade">−</button><span class="num">'+i.qtd+'</span><button type="button" data-mais="'+k+'" aria-label="Aumentar quantidade">+</button></div></div>';
    }).join("");
    $("total").textContent = real(totalSacola());
    atualizarLinks();
  }
  $("itens").addEventListener("click",function(e){
    var m=e.target.closest("[data-mais]"), d=e.target.closest("[data-menos]");
    if(m){ var i=sacola[+m.getAttribute("data-mais")]; i.qtd=Math.min(20,i.qtd+1); }
    else if(d){ var k=+d.getAttribute("data-menos"); sacola[k].qtd--; if(sacola[k].qtd<1) sacola.splice(k,1); }
    else return;
    salvar(); desenharSacola();
  });
  $("abrir-sacola").addEventListener("click",function(){ desenharSacola(); $("sacola").showModal(); });
  $("fechar-sacola").addEventListener("click",function(){ $("sacola").close(); });
  $("sacola").addEventListener("click",function(e){ if(e.target===$("sacola")) $("sacola").close(); });
  $("form-pedido").addEventListener("input",atualizarLinks);
  $("form-pedido").addEventListener("change",atualizarLinks);

  /* CEP: preenche rua, bairro e cidade */
  $("cep").addEventListener("input",function(){
    var d=this.value.replace(/\D/g,"").slice(0,8); this.value=d.length>5?d.slice(0,5)+"-"+d.slice(5):d;
    if(d.length!==8) return;
    var msg=$("cep-msg"); msg.textContent="Buscando o CEP…";
    fetch("https://viacep.com.br/ws/"+d+"/json/").then(function(r){ return r.json(); }).then(function(e){
      if(!e || e.erro) throw new Error();
      $("endereco").value=(e.logradouro?e.logradouro+", nº ":"")+"\n"+[e.bairro,e.localidade+" – "+e.uf,"CEP "+$("cep").value].filter(Boolean).join(", ");
      msg.textContent="Achei. Complete com o número e, se tiver, o complemento."; atualizarLinks(); $("endereco").focus();
    }).catch(function(){ msg.textContent="Não consegui buscar esse CEP. Escreva o endereço completo abaixo."; });
  });

  /* pagamento */
  function avisar(t){ $("msg").textContent=t; $("msg").hidden=!t; }
  $("form-pedido").addEventListener("submit",function(e){
    e.preventDefault(); avisar("");
    var nome=$("nome").value.trim(), tel=$("telefone").value.replace(/\D/g,""), entrega=$("rec-entrega").checked, end=$("endereco").value.trim();
    if(nome.length<3){ avisar("Escreva seu nome para a gente separar o pedido."); $("nome").focus(); return; }
    if(tel.length<10){ avisar("Informe seu WhatsApp com DDD."); $("telefone").focus(); return; }
    if(entrega && end.length<8){ avisar("Informe o endereço de entrega."); $("endereco").focus(); return; }
    var pedido={ itens:sacola, cliente:{nome:nome,whatsapp:tel}, recebimento:entrega?"entrega":"retirada", endereco:end, resumo:textoPedido(), total:totalSacola() };
    try{ localStorage.setItem("ideal_pedido", JSON.stringify(pedido)); }catch(err){}
    try{ if(window.gtag) window.gtag("event","begin_checkout",{currency:"BRL",value:totalSacola()}); if(window.fbq) window.fbq("track","InitiateCheckout",{value:totalSacola(),currency:"BRL"}); }catch(err){}
    var botao=$("pagar"); botao.disabled=true; botao.textContent="Abrindo pagamento…";
    fetch("/api/criar-pagamento",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(pedido)})
      .then(function(r){ return r.json().then(function(d){ if(!r.ok||!d.url) throw new Error(d.erro||""); return d; }); })
      .then(function(d){ window.location.href=d.url; })
      .catch(function(err){
        botao.disabled=false; botao.textContent="Pagar com Pix, cartão ou boleto";
        avisar((err && err.message && !/fetch|JSON|token/i.test(err.message) ? err.message+" " : "O pagamento online ainda não está ativo neste endereço. ")+"Use o botão verde para fechar o pedido pelo WhatsApp.");
      });
  });

  /* categorias com foto, rodapé e topo */
  $("cats").innerHTML = categorias.map(function(c){
    var itens=PRODUTOS.filter(function(p){return p.categoria===c;});
    var capa=(LOJA.destaques||[]).map(produto).filter(function(p){return p && p.categoria===c;})[0] || itens[0];
    return '<button type="button" class="cat" data-ir="'+esc(c)+'"><img src="'+esc(capa.foto)+'" alt="" loading="lazy"><span class="rot"><b>'+esc(c)+'</b><small>'+itens.length+(itens.length===1?" produto":" produtos")+'</small></span></button>';
  }).join("");
  $("rod-cats").innerHTML = categorias.map(function(c){ return '<li><a href="#produtos" data-ir="'+esc(c)+'">'+esc(c)+'</a></li>'; }).join("");
  document.addEventListener("click",function(e){
    var b=e.target.closest("[data-ir]"); if(!b) return;
    e.preventDefault(); escolher(b.getAttribute("data-ir")); $("produtos").scrollIntoView({behavior:calmo?"auto":"smooth"});
  });
  window.addEventListener("scroll",function(){ var y=window.scrollY||0; $("topo").classList.toggle("rolou",y>40); $("subir").hidden=y<900; },{passive:true});
  $("subir").addEventListener("click",function(){ window.scrollTo({top:0,behavior:calmo?"auto":"smooth"}); });

  desenharFiltros(); desenharVitrine(); desenharSacola(); abrirPeloLink();

  /* entrada suave ao rolar */
  if(!calmo && "IntersectionObserver" in window){
    var io=new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.remove("espera"); io.unobserve(en.target); } }); },{rootMargin:"0px 0px -8% 0px"});
    [].forEach.call(document.querySelectorAll(".cat,.vantagens li,.passos li,.bloco,.prateleira,.insta .miolo > *,.rod-grid > *,.rod-verso"),function(el,i){
      el.classList.add("surge");
      if(el.getBoundingClientRect().top > window.innerHeight){ el.style.transitionDelay=(i%4*70)+"ms"; el.classList.add("espera"); io.observe(el); }
    });
  }
})();
