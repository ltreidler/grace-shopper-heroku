import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCart,
  fetchCart,
  order
} from "../cart/cartSlice";
import { Accordion, Form, Container, Row, Col, Button, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import PaymentForm from "./PaymentForm";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";

const CheckoutPage = () => {
  const [active, setActive] = useState(8);
  const [loading, setLoading] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [price, setPrice] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [sessionTime, setSessionTime] = useState(300000);
  let timer;

  const stripePromise = loadStripe("pk_test_51MiLhrLln7p5YtECXlXKOV96PLFeJJODhaJDVS6BDy060PbpOXXz6NeFDUm1MyEl3XpnQQ4Ei0a0V8yPGSo9f6LO002aPDefM3");
  const appearance = {
    theme: "stripe",
  };
  const options = { clientSecret, appearance };
  const [clientSecret, setClientSecret] = useState("");

  const dispatch = useDispatch();
  const { me } = useSelector((state) => state.auth);
  const {cartItems, error} = useSelector(selectCart);
  const navigate = useNavigate();

  function updateSessionTime () {
    timer = !timer && setInterval(() => {
      setSessionTime(sessionTime - 1000)
    }, 1000);

    if(sessionTime <= 0) navigate('/cart');
  }

  useEffect(() => {
    updateSessionTime();

    return () => clearInterval(timer);
  })
 
  useEffect(() => {
    dispatch(fetchCart());
    
  }, [dispatch]);

  useEffect(() => {
    getSecret();
  }, []);

  async function getSecret() {
    try {
      const { data } = await axios.post("/api/payments/create-payment-intent", {
        cartItems,
      });

      setClientSecret(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    //if it's a user, start active at event key 1, else 0
    setActive(me && me.password ? 1 : 0);
  }, [me]);

  useEffect(() => {
    if(cartItems && cartItems.length) {
        setPrice(cartItems.reduce((sum, {product: {price}, qty}) => sum + (price * qty), 0));
    }
  }, [cartItems])

  useEffect(() => {
    if(loading) {
      if(cartItems.length === 0) {
        setConfirmed(true);
        console.log('confirming!');
      } else {
        setOrderError('There was an issue with your order. Please try again later.');
      }
    }
  }, [loading, cartItems]);

  function testEmail(email) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  }

  function millToMin(ms) {
    let minutes = Math.floor(ms/60000);
    let seconds = ((ms%60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  function placeOrder() {
    setLoading(true);
    dispatch(order(testEmail(guestEmail) ? guestEmail : null))
  }


  const Confirmation = () => (
    <Container>
      <Row>
        <h1>Thank you for your order!</h1>
      </Row>
      <Row>
        <Link to="/products">Click here to keep browsing our plants</Link>
      </Row>
    </Container>
  )

  //if there are no items in the cart, tell user to go to home
  return (
    <>
    { confirmed ? <Confirmation /> : <>
      {cartItems && cartItems.length ? <Container>
      {<p>{millToMin(sessionTime)} minutes remaining in session</p>}
        <Row>
        <Col md={6}>
        <Accordion activeKey={[active.toString()]}>
        <h1>Checkout</h1>
          {!me || !me.password ? <Accordion.Item eventKey="0">
            <Accordion.Header>Account details</Accordion.Header>
            <Accordion.Body>
              <Form>
              <Button>
                    <Link to="/login"
                    style={{textDecoration: "none", color: "white"}}>Log in</Link>
                </Button>{' '}
                <Button>
                    <Link to="/signup"
                    style={{textDecoration: "none", color: "white"}}>Create an account</Link>
                </Button>
                <Form.Group style={{width: "25rem"}} className="mb-3">
                    <Form.Label>Enter email address to checkout as guest</Form.Label>
                    <Form.Control type="email" placeholder="Enter email" required
                    onChange={(e) => setGuestEmail(e.target.value)}
                    />
                    <Form.Text className="text-muted">
                    {!guestEmail.length || testEmail(guestEmail) ? "" : "Please enter a valid email"}
                    </Form.Text>
                </Form.Group>
                <Button
                    disabled={!testEmail(guestEmail)}
                    onClick={() => setActive(1)}>Next</Button>
              </Form>
            </Accordion.Body> 
            </Accordion.Item>: null}
        
          <Accordion.Item eventKey="1">
            <Accordion.Header>Shipping Information</Accordion.Header>
            <Accordion.Body>
              Shipping info here
              <p></p>
              {guestEmail && guestEmail.length ? <Button onClick={() => setActive(0)}>Back</Button> : null} {' '}
              <Button onClick={() => setActive(2)}>Next</Button>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="2">
            <Accordion.Header>Payment information</Accordion.Header>
            <Accordion.Body>
            <Elements options={options} stripe={stripePromise}>
              <PaymentForm />
            </Elements>
              <Button onClick={() => setActive(1)}>Back</Button>{' '}
              <Button onClick={placeOrder} disabled={loading}>Place order</Button>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
        {orderError && <p>{orderError}</p>}
        </Col>
        
    <Col md={4}> 
    <Table bordered>
      <thead>
        <tr>
          <th>Product</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
      {
        cartItems.map(({id, product, qty}) => {
            return (<tr key={id}>
                <td>
                    {product.name} x {qty}
                </td>
                <td>
                    ${parseFloat(product.price * qty).toFixed(2)}
                </td>
            </tr>)
        })
      }
        <tr>
          <th>Subtotal</th>
          <th>${price}.00</th>
        </tr>
        <tr>
          <th>Shipping</th>
          <th>${5.99}</th>
        </tr>
        <tr>
          <th>Total</th>
          <th>${parseFloat(price+5.99).toFixed(2)}</th>
        </tr>
      </tbody>
    </Table>
    </Col> 
    </Row>
    </Container>
      : <div>Your cart is empty. <Link to="/products">Click here to browse our plants!</Link></div>}
    </>}
    </>
  );
};

export default CheckoutPage;
