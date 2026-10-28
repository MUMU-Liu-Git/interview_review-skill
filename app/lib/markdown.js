/* 迷你 Markdown 解析器（从原模板原样移植，输出逐字一致）。
 * 先 esc 整段转义再拼标签，所以 v-html 渲染它的输出是安全的。 */
export function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
export function inline(s){
  return s
    .replace(/`([^`]+)`/g,(m,c)=>'<code>'+c+'</code>')
    .replace(/(\*\*)?Q(\d{1,4})\1/g,'<a class="qjump" data-qid="q$2" href="#q$2">Q$2</a>')
    .replace(/==([bopr])\|([^=]*)==/g,'<span class="hl hl-$1">$2</span>')
    .replace(/!!([^!]+)!!/g,'<span class="dgr">$1</span>')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/【(亮|稳|改|漏|翻)([^】]*)】/g,function(m,f,rest){
      var cls={'亮':'f-star','稳':'f-ok','改':'f-fix','漏':'f-miss','翻':'f-fail'}[f];
      return '<span class="rflag '+cls+'">'+f+'</span>'+rest.replace(/^[·：:]\s*/,'');
    })
    .replace(/<strong>(<span class="rflag f-(?:fix|miss|fail)")/g,'<strong class="dgr-strong">$1')
    .replace(/<strong>(<span class="rflag f-(?:star|ok)")/g,'<strong class="pos-strong">$1')
    .replace(/｜/g,'<span class="vsep">｜</span>');
}
export function liWrap(c){return '<li'+(/rflag f-(fail|miss)/.test(c)?' class="danger-block"':'')+'>'+c+'</li>';}
/* 复盘条目拆分：问题（领头加粗）→ 答案 → 点评（含 flag/题号），分点缩进 */
export function reviewItem(c){
  if(c.indexOf('→')<0) return liWrap(c);
  const ai=c.indexOf('→');
  const q=c.slice(0,ai).trim();
  let rest=c.slice(ai+1).trim();
  let answer=rest,concl='';
  const fi=rest.search(/<strong><span class="rflag|<strong>【/);
  if(fi>=0){answer=rest.slice(0,fi).trim();concl=rest.slice(fi).trim();}
  let sub='<ul class="rv-sub">';
  if(answer.replace(/<[^>]*>/g,'').replace(/[。、\s]/g,'')) sub+='<li class="rv-a">'+answer+'</li>';
  if(concl){const cd=/rflag f-(fail|miss)/.test(concl);sub+='<li class="rv-c'+(cd?' danger-block':'')+'">'+concl+'</li>';}
  sub+='</ul>';
  return '<li class="rv-item"><div class="rv-q">'+q+'</div>'+sub+'</li>';
}
export function mdToHtml(md,opts){
  opts=opts||{};
  if(!md||!md.trim())return '';
  const lines=esc(md).split('\n');let html='',i=0;
  while(i<lines.length){
    let l=lines[i];
    if(/^```/.test(l)){let code='';i++;while(i<lines.length&&!/^```/.test(lines[i])){code+=lines[i]+'\n';i++;}i++;html+='<pre><code>'+code+'</code></pre>';continue;}
    let h=l.match(/^(#{1,4})\s+(.*)/);
    if(h){const n=h[1].length;html+='<h'+n+'>'+inline(h[2])+'</h'+n+'>';i++;continue;}
    if(/^&gt;\s?/.test(l)){let bq='';while(i<lines.length&&/^&gt;\s?/.test(lines[i])){bq+=lines[i].replace(/^&gt;\s?/,'')+' ';i++;}html+='<blockquote>'+inline(bq.trim())+'</blockquote>';continue;}
    if(/^\s*[-*+]\s+/.test(l)){let items='';while(i<lines.length&&/^\s*[-*+]\s+/.test(lines[i])){const c=inline(lines[i].replace(/^\s*[-*+]\s+/,''));items+=opts.review?reviewItem(c):liWrap(c);i++;}html+='<ul>'+items+'</ul>';continue;}
    if(/^\s*\d+\.\s+/.test(l)){let items='';while(i<lines.length&&/^\s*\d+\.\s+/.test(lines[i])){items+=liWrap(inline(lines[i].replace(/^\s*\d+\.\s+/,'')));i++;}html+='<ol>'+items+'</ol>';continue;}
    if(/^\s*---\s*$/.test(l)){html+='<hr>';i++;continue;}
    if(l.trim()===''){i++;continue;}
    let para=l;while(i+1<lines.length&&lines[i+1].trim()!==''&&!/^(#{1,4}\s|&gt;|\s*[-*+]\s|\s*\d+\.\s|```|\s*---)/.test(lines[i+1])){para+='<br>'+lines[i+1];i++;}
    const ph=inline(para);
    html+='<p'+(/rflag f-(fail|miss)/.test(ph)?' class="danger-block"':'')+'>'+ph+'</p>';i++;
  }
  return html;
}
