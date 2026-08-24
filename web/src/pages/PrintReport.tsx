import { ArrowLeft } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useQuote } from "../lib/QuoteContext";
import {
  categoryTotal,
  formatMoney,
  grandTotal,
  lineSubtotal,
  loadLastNote,
} from "../lib/quote";

export function PrintReport() {
  const { quote, loading } = useQuote();
  const note = loadLastNote();

  if (loading || !quote) {
    return (
      <div className="min-h-[100dvh] bg-paper px-6 py-10" aria-busy="true">
        正在整理工册…
      </div>
    );
  }

  const total = grandTotal(quote);
  const empty = quote.categories.every((category) => category.items.every((item) => lineSubtotal(item) === 0));

  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <div className="no-print mx-auto flex max-w-[210mm] items-center justify-between px-6 py-4">
        <Link to="/" className="inline-flex cursor-pointer items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft size={16} />
          返回工册
        </Link>
        <button
          type="button"
          className="cursor-pointer bg-copper px-4 py-2 text-sm text-paper hover:bg-copper-dark"
          onClick={() => window.print()}
        >
          打印
        </button>
      </div>

      <article className="mx-auto max-w-[210mm] px-6 pb-16">
        <header className="border-b border-ink pb-4">
          <p className="font-serif text-3xl tracking-tight">装册</p>
          <h1 className="mt-2 text-lg">装修预算清单</h1>
          <p className="mt-2 text-sm text-muted">
            生成时间 {new Date().toLocaleString("zh-CN")}
          </p>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <Meta label="套内面积" value={quote.house.area == null ? "未填" : `${quote.house.area}㎡`} />
          <Meta label="模式" value={quote.house.packageType} />
          <Meta label="卫生间" value={`${quote.house.bathrooms}间`} />
          <Meta label="封阳台" value={quote.house.encloseBalcony ? "是" : "否"} />
        </section>

        {empty ? (
          <p className="mt-8 text-sm text-muted" role="status">
            工册还没有金额。回到工册填写单价和数量后再打印。
          </p>
        ) : null}

        {quote.categories.map((category) => {
          if (category.items.length === 0) {
            return null;
          }
          return (
            <section key={category.name} className="mt-8">
              <h2 className="border-b border-rule pb-2 font-serif text-lg">
                {category.name}
                <span className="ml-3 font-mono text-sm text-copper">
                  {formatMoney(categoryTotal(category))}
                </span>
              </h2>
              <table className="mt-3 w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-muted">
                    <th className="py-2 font-normal">项目</th>
                    <th className="py-2 font-normal">单位</th>
                    <th className="py-2 text-right font-normal">数量</th>
                    <th className="py-2 text-right font-normal">单价</th>
                    <th className="py-2 text-right font-normal">小计</th>
                  </tr>
                </thead>
                <tbody>
                  {category.items.map((item) => (
                    <tr key={item.id} className="border-t border-rule">
                      <td className="py-2">{item.name}</td>
                      <td className="py-2">{item.unit}</td>
                      <td className="py-2 text-right font-mono tabular-nums">{item.quantity}</td>
                      <td className="py-2 text-right font-mono tabular-nums">{formatMoney(item.price)}</td>
                      <td className="py-2 text-right font-mono tabular-nums">
                        {formatMoney(lineSubtotal(item))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })}

        <p className="mt-10 text-right font-mono text-2xl text-copper tabular-nums">
          总计 ¥ {formatMoney(total)}
        </p>

        {note ? (
          <section className="mt-10 border-t border-rule pt-6">
            <h2 className="font-serif text-lg">最近一次助手说明</h2>
            <p className="mt-3 max-w-[65ch] whitespace-pre-wrap text-sm leading-relaxed">{note}</p>
          </section>
        ) : null}
      </article>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
