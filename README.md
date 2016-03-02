# مُقَوْلِب
محرك قوالب للغة javascript

# الهيكلة العامة
افتراضيًا لكل جملة في مُقولب ما يلي  :
- خياراتها .
- متغيراتها المساعدة

**ملاحظة:**ليس بالضرورة أن يكون لكل جملة خيارات أو متغيرات مساعدة .
# الاستخدام
## الاستدعاء
```html
<script type='text/javscript' src='../path/to/Mokawleb'></script>
<-- تستطيع استخدام هذه الطريقة للأجاكس مثلًا -->
<script type='Mokawlib/html' id='myid'>
  <!-- your html code -->
</script>
<script type='text/javascript'>
  var data = {} // .. your data object 
  var html = document.getElementById('myid').innerHTML;
  var result = render(html,data);
  selector.innerHTML = result;
</script>
```
## الكتابة 
- الأوامر صيغتها هكذا : `{{@command attributs}} ... {{@end}}`
- المتغيرات صيغتها هكذا : `{{variable}}`
- المتغيرات المساعدة صيغتها هكذا : `{{command.variable}}`

## الجُمل
يدعم **مقولب** في الوقت الحالي الجُمل التالية :

- الحلقات : 
  - خياراتها : 
    - `times` : عدد مرات تكرار المصفوفة  :
      1. **اختياري** : إذا وجد في محتوى الحلقة متغيّر ضمن مصفوفة .
      2. **إجباري** : إن لم تتحق الفقرة a
      3. **ملاحظة** : الأولوية دائمًا للخيار `times` .
  - المتغيرات المساعدة :
    - `loop.count` : يُرجع عدد التكرار الحالي ، شاهد المثال القادم .
```html
<ul>
{{@loop times:10}} <!-- يتكرر المحتوى 10 مرات . -->
  <li>{{loop.count}}</li> <!-- متغير خاص بالحلقات يعيد عدد التكرار الحالي -->
{{@end}}
</ul>

<!-- النتيجة : -->
<ul>
  <li>1</li>
  <li>2</li>
  <li>3</li>
  ..
  ..
  <li>10</li>
</ul>
```
إذا وُجد في الحلقة متغيّر ضمن مصفوفة يتم التكرار بحسب عدد عناصر المصفوفة ، مثلًا لدينا هذه البيانات :
```json
{"users":[
  {"name":"x","login":true},
  {"name":"y","login":false}
]}
```
ستكون الشفرة الخاصة بها هكذا :
```html
<ul>
{{@loop}} <!-- سيتكرر المحتوى بحسب عدد عناصر المصفوفة users-->
  <li>{{users.name}} , login : {{users.login}}</li> <!-- متغير خاص بالحلقات يعيد عدد التكرار الحالي -->
{{@end}}
</ul>

<!-- النتيجة : -->
<ul>
  <li>x , login : true</li>
  <li>y , login : false</li>
</ul>
```

- الجملة الشرطية `if` :
  - خياراتها :
    - الشرط / الشروط :
      - *تدعم* : ``&&`` كالرابط "و" و ``||``` كالرابط أو .
      - **العمليات** : `==` , `!=` , `<` , `>` , `<=` , `>=` .
      - **تدعم** المتغيرات عن طريق تعريفها هكذا : `#variablename` .
    - الجملة `else` عن طريق تعريفها داخل الشرط هكذا : `{{@else}}` .
مثال : 
```html
{{@if #appname == X}} <!-- X هاهُنا تعامل كنص String -->
<h3>Hello I'm the unknown X!</h3>
{{@else}}
<h3>my name is {{appname}} ...... </h3>
{{@end}}
<!-- الشروط المتعددة -->
{{@if 3 < 5 && 3 == 3}}
<h3>3</h3>
{{@end}}
```

# ما سُيعمل
- دعم الجمل الشرطية في الحلقات .
- دعم الجملة `elseif` في الجمل الشرطية .
- دعم حلقة `while`
