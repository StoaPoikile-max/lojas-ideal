(function(){
  var $=function(id){return document.getElementById(id);};
  var q=new URLSearchParams(location.search);
  var nomes={credit_card:"cartão de crédito",debit_card:"cartão de débito",bank_transfer:"Pix",ticket:"boleto",account_money:"saldo Mercado Pago"};
  var ref=q.get("external_reference")||"", pagamento=q.get("payment_id")||q.get("collection_id")||"";
  var pedido=null; try{ pedido=JSON.parse(localStorage.getItem("ideal_pedido")); }catch(e){}
  var resumo=pedido&&typeof pedido.resumo==="string"?pedido.resumo.slice(0,4000):"";

  function naoConcluido(texto){
    $("titulo").textContent="O pagamento não foi concluído";
    $("texto").textContent=texto||"Nada foi confirmado. Sua sacola continua salva: você pode tentar de novo ou fechar o pedido pelo WhatsApp.";
    $("voltar").hidden=false;
  }
  function mostrar(situacao,forma){
    var aprovado=situacao==="aprovado", conferir=situacao==="conferir";
    var tipo=Object.prototype.hasOwnProperty.call(nomes,forma)?nomes[forma]:"";
    var linha=aprovado?"Pagamento aprovado":conferir?"Pagamento feito, aguardando a loja conferir":"Pagamento aguardando confirmação";
    var msg="Olá, Lojas Ideal! Fiz um pedido pelo site.\n"+"Pedido: "+ref+"\n"+
      linha+(tipo?" ("+tipo+")":"")+" · nº "+pagamento+"\n\n"+resumo.replace(/^Olá[^\n]*\n/,"");
    var link="https://wa.me/"+LOJA.whatsapp+"?text="+encodeURIComponent(msg);
    $("titulo").textContent=aprovado?"Pagamento aprovado. Obrigado!":conferir?"Pedido recebido. Vamos conferir o pagamento.":"Pedido recebido. Falta o pagamento cair.";
    $("texto").textContent=aprovado
      ?"Vamos te levar para o WhatsApp da loja para confirmar a retirada ou combinar a entrega."
      :conferir
      ?"Não conseguimos confirmar o pagamento automaticamente agora. Mande a mensagem abaixo no WhatsApp que a loja confere e separa suas peças."
      :"Boleto e alguns Pix levam um tempo para confirmar. Mande a mensagem abaixo no WhatsApp para a gente já separar suas peças.";
    if(resumo){ $("resumo").textContent=msg; $("resumo").hidden=false; }
    $("zap").href=link; $("zap").hidden=false;
    if(aprovado){ try{ localStorage.removeItem("ideal_sacola"); }catch(e){} }
    var s=5;
    var t=setInterval(function(){
      $("contagem").textContent="Abrindo o WhatsApp em "+s+" s…";
      if(s--<=0){ clearInterval(t); $("contagem").textContent="Se o WhatsApp não abriu, toque no botão verde."; location.href=link; }
    },1000);
  }

  /* O que vem no endereço da página não é confiável: quem confirma é o servidor,
     perguntando ao Mercado Pago. */
  if(!/^\d{5,20}$/.test(pagamento) || !/^ID[0-9A-Z]{6,14}$/.test(ref)){ naoConcluido(); return; }
  fetch("/api/situacao-pagamento?id="+encodeURIComponent(pagamento)+"&pedido="+encodeURIComponent(ref),{cache:"no-store"})
    .then(function(r){
      if(r.status===404||r.status===400) return {situacao:"nao_concluido"};
      if(!r.ok) return {situacao:"conferir"};
      return r.json();
    })
    .catch(function(){ return {situacao:"conferir"}; })
    .then(function(d){
      if(d.situacao==="aprovado"||d.situacao==="pendente"||d.situacao==="conferir") mostrar(d.situacao,d.forma);
      else naoConcluido();
    });
})();
